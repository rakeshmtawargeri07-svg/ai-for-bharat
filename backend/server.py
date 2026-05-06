from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import random
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------- Setup ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
ACCESS_MIN = 60 * 24  # 1 day for demo

app = FastAPI(title="GridSense AI")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BANGALORE_ZONES = [
    {"name": "Whitefield",     "lat": 12.9698, "lng": 77.7500, "type": "commercial",  "cap": 1800, "load": 1420, "chargers": 18},
    {"name": "Koramangala",    "lat": 12.9352, "lng": 77.6245, "type": "residential", "cap": 1500, "load": 1180, "chargers": 14},
    {"name": "HSR Layout",     "lat": 12.9116, "lng": 77.6473, "type": "residential", "cap": 1400, "load": 1050, "chargers": 12},
    {"name": "Electronic City","lat": 12.8458, "lng": 77.6692, "type": "industrial",  "cap": 2200, "load": 1850, "chargers": 22},
    {"name": "Indiranagar",    "lat": 12.9784, "lng": 77.6408, "type": "commercial",  "cap": 1300, "load": 980,  "chargers": 11},
    {"name": "Marathahalli",   "lat": 12.9591, "lng": 77.6974, "type": "commercial",  "cap": 1600, "load": 1240, "chargers": 13},
    {"name": "BTM Layout",     "lat": 12.9166, "lng": 77.6101, "type": "residential", "cap": 1250, "load": 870,  "chargers": 9},
    {"name": "Jayanagar",      "lat": 12.9250, "lng": 77.5938, "type": "residential", "cap": 1350, "load": 920,  "chargers": 10},
]

EV_MODELS = ["Tata Nexon EV", "MG ZS EV", "Hyundai Kona", "Mahindra XUV400", "Tata Tigor EV", "BYD Atto 3", "Ola S1 Pro"]

# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    ev_model: str
    zone_id: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AdminLoginIn(BaseModel):
    employee_id: str
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    ev_model: Optional[str] = None
    zone_id: Optional[str] = None
    employee_id: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    ev_model: Optional[str] = None
    zone_id: Optional[str] = None

class PlannerIn(BaseModel):
    target_pct: int
    hours_available: int

class ScheduleAction(BaseModel):
    schedule_id: str
    action: Literal["accept", "reject"]

class BulkAction(BaseModel):
    schedule_ids: List[str]
    action: Literal["accept", "reject"]

# ---------- Helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MIN),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def set_auth_cookie(resp: Response, token: str):
    resp.set_cookie("access_token", token, httponly=True, secure=False,
                    samesite="lax", max_age=ACCESS_MIN * 60, path="/")

def clean_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "name": u.get("name"),
        "email": u.get("email"),
        "role": u.get("role"),
        "phone": u.get("phone"),
        "ev_model": u.get("ev_model"),
        "zone_id": u.get("zone_id"),
        "employee_id": u.get("employee_id"),
    }

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        h = request.headers.get("Authorization", "")
        if h.startswith("Bearer "):
            token = h[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user

async def require_customer(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "customer":
        raise HTTPException(403, "Customer access required")
    return user

# ---------- Seeding ----------
async def seed_data():
    # Admins
    admins = [
        {"employee_id": "EMP001", "password": "bescom@123", "name": "Rajesh Kumar"},
        {"employee_id": "EMP002", "password": "admin@456",  "name": "Priya Sharma"},
        {"employee_id": "EMP003", "password": "grid@789",   "name": "Anand Iyer"},
    ]
    for a in admins:
        existing = await db.users.find_one({"employee_id": a["employee_id"]})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "employee_id": a["employee_id"],
                "name": a["name"],
                "email": f"{a['employee_id'].lower()}@bescom.gov.in",
                "password_hash": hash_pw(a["password"]),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        else:
            # Always reset to known password for demo
            await db.users.update_one(
                {"employee_id": a["employee_id"]},
                {"$set": {"password_hash": hash_pw(a["password"])}}
            )

    # Zones
    if await db.zones.count_documents({}) == 0:
        zone_docs = []
        for z in BANGALORE_ZONES:
            zone_docs.append({
                "id": str(uuid.uuid4()),
                "name": z["name"], "lat": z["lat"], "lng": z["lng"],
                "grid_capacity_kw": z["cap"],
                "current_load_kw": z["load"],
                "ev_charger_count": z["chargers"],
                "zone_type": z["type"],
            })
        await db.zones.insert_many(zone_docs)

    zones = await db.zones.find({}, {"_id": 0}).to_list(100)

    # Stations
    if await db.stations.count_documents({}) == 0:
        stations = []
        for z in zones:
            n = z["ev_charger_count"]
            for i in range(min(n, 6)):
                lat = z["lat"] + random.uniform(-0.012, 0.012)
                lng = z["lng"] + random.uniform(-0.012, 0.012)
                util = random.randint(20, 95)
                status = "overloaded" if util > 85 else ("active" if util > 50 else "idle")
                stations.append({
                    "id": str(uuid.uuid4()),
                    "zone_id": z["id"],
                    "zone_name": z["name"],
                    "name": f"{z['name']} Charge Hub {i+1}",
                    "lat": lat, "lng": lng,
                    "charger_type": random.choice(["slow", "fast", "rapid"]),
                    "status": status,
                    "current_utilization_pct": util,
                })
        await db.stations.insert_many(stations)

    stations = await db.stations.find({}, {"_id": 0}).to_list(500)

    # Forecast (24h per zone)
    if await db.forecasts.count_documents({}) == 0:
        today = datetime.now(timezone.utc).date().isoformat()
        forecasts = []
        for z in zones:
            base = z["current_load_kw"]
            for h in range(24):
                # Demand curve: low overnight, peaks 8-11am and 6-10pm
                if 0 <= h < 6:
                    factor = 0.45 + random.uniform(-0.05, 0.05)
                elif 6 <= h < 9:
                    factor = 0.65 + (h - 6) * 0.1 + random.uniform(-0.05, 0.05)
                elif 9 <= h < 12:
                    factor = 0.95 + random.uniform(-0.08, 0.08)
                elif 12 <= h < 17:
                    factor = 0.75 + random.uniform(-0.07, 0.07)
                elif 17 <= h < 22:
                    factor = 1.0 + random.uniform(-0.05, 0.1)
                else:
                    factor = 0.55 + random.uniform(-0.05, 0.05)
                forecasts.append({
                    "id": str(uuid.uuid4()),
                    "zone_id": z["id"],
                    "forecast_hour": h,
                    "predicted_demand_kw": round(base * factor, 1),
                    "confidence_score": round(random.uniform(0.78, 0.97), 2),
                    "date": today,
                })
        await db.forecasts.insert_many(forecasts)

    # Events
    if await db.events.count_documents({}) == 0:
        events = []
        types = ["peak_stress", "overload", "maintenance"]
        sevs = ["low", "medium", "high", "critical"]
        msgs = {
            "peak_stress": "Peak demand stress detected — consider load shifting.",
            "overload": "Grid overload risk — immediate action recommended.",
            "maintenance": "Scheduled transformer maintenance window.",
        }
        for _ in range(28):
            z = random.choice(zones)
            t = random.choice(types)
            s = random.choices(sevs, weights=[3, 4, 2, 1])[0]
            days_ago = random.randint(0, 6)
            events.append({
                "id": str(uuid.uuid4()),
                "zone_id": z["id"],
                "zone_name": z["name"],
                "event_type": t,
                "severity": s,
                "message": f"{msgs[t]} ({z['name']})",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat(),
                "resolved": random.random() > 0.6,
            })
        await db.events.insert_many(events)

    # Schedules
    if await db.schedules.count_documents({}) == 0:
        schedules = []
        for st in random.sample(stations, min(20, len(stations))):
            start_h = random.choice([22, 23, 0, 1, 2, 3])
            schedules.append({
                "id": str(uuid.uuid4()),
                "station_id": st["id"],
                "station_name": st["name"],
                "zone_id": st["zone_id"],
                "zone_name": st["zone_name"],
                "recommended_start": f"{start_h:02d}:00",
                "recommended_end": f"{(start_h + random.randint(2, 5)) % 24:02d}:00",
                "load_shift_kw": random.randint(40, 220),
                "reason": f"Off-peak window — grid load drops to {random.randint(35, 55)}% in {st['zone_name']}",
                "status": random.choices(["pending", "accepted", "rejected"], weights=[5, 3, 1])[0],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        await db.schedules.insert_many(schedules)

    # Demo customer
    if not await db.users.find_one({"email": "demo@gridsense.in"}):
        z = zones[0]
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Arjun Reddy",
            "email": "demo@gridsense.in",
            "phone": "+91 98765 43210",
            "password_hash": hash_pw("demo@123"),
            "role": "customer",
            "ev_model": "Tata Nexon EV",
            "zone_id": z["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Sessions for demo customer
    demo = await db.users.find_one({"email": "demo@gridsense.in"}, {"_id": 0})
    if demo and await db.sessions.count_documents({"user_id": demo["id"]}) == 0:
        sessions = []
        for i in range(8):
            st = random.choice(stations)
            kwh = round(random.uniform(15, 45), 1)
            cost = round(kwh * random.uniform(8, 14), 1)
            sessions.append({
                "id": str(uuid.uuid4()),
                "user_id": demo["id"],
                "station_id": st["id"],
                "station_name": st["name"],
                "start_time": (datetime.now(timezone.utc) - timedelta(days=i, hours=random.randint(0, 12))).isoformat(),
                "end_time":   (datetime.now(timezone.utc) - timedelta(days=i, hours=random.randint(0, 5))).isoformat(),
                "energy_consumed_kwh": kwh,
                "cost_inr": cost,
                "schedule_followed": random.random() > 0.4,
            })
        await db.sessions.insert_many(sessions)

    # Extra customers
    if await db.users.count_documents({"role": "customer"}) < 12:
        names = ["Sneha Rao", "Vikram Singh", "Meera Nair", "Karthik Subramaniam", "Divya Pillai",
                "Rohit Mehta", "Ananya Bose", "Suresh Reddy", "Lakshmi Venkatesh", "Aditya Joshi", "Nikhil Shetty"]
        for name in names:
            email = name.lower().replace(" ", ".") + "@example.com"
            if await db.users.find_one({"email": email}):
                continue
            z = random.choice(zones)
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "phone": f"+91 9{random.randint(1000000000, 9999999999)}"[:14],
                "password_hash": hash_pw("user@123"),
                "role": "customer",
                "ev_model": random.choice(EV_MODELS),
                "zone_id": z["id"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })


# ---------- Routes ----------
@api.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

@api.get("/zones")
async def list_zones():
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)
    # Compute stress level
    for z in zones:
        pct = (z["current_load_kw"] / z["grid_capacity_kw"]) * 100
        z["load_pct"] = round(pct, 1)
        z["stress"] = "critical" if pct >= 90 else "high" if pct >= 75 else "medium" if pct >= 55 else "low"
    return zones

# Auth
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    zone = await db.zones.find_one({"id": data.zone_id})
    if not zone:
        raise HTTPException(400, "Invalid zone")
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": email,
        "phone": data.phone,
        "password_hash": hash_pw(data.password),
        "role": "customer",
        "ev_model": data.ev_model,
        "zone_id": data.zone_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    token = make_token(user["id"], "customer")
    set_auth_cookie(response, token)
    return {"user": clean_user(user), "token": token}

@api.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email, "role": "customer"}, {"_id": 0})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = make_token(user["id"], "customer")
    set_auth_cookie(response, token)
    return {"user": clean_user(user), "token": token}

@api.post("/auth/admin-login")
async def admin_login(data: AdminLoginIn, response: Response):
    user = await db.users.find_one({"employee_id": data.employee_id, "role": "admin"}, {"_id": 0})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid Employee ID or password")
    token = make_token(user["id"], "admin")
    set_auth_cookie(response, token)
    return {"user": clean_user(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return clean_user(user)

# Customer
@api.get("/customer/dashboard")
async def customer_dashboard(user: dict = Depends(require_customer)):
    zone = await db.zones.find_one({"id": user["zone_id"]}, {"_id": 0}) if user.get("zone_id") else None
    if zone:
        pct = (zone["current_load_kw"] / zone["grid_capacity_kw"]) * 100
        zone["load_pct"] = round(pct, 1)
        zone["stress"] = "critical" if pct >= 90 else "high" if pct >= 75 else "medium" if pct >= 55 else "low"
    # Recent sessions
    sessions = await db.sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("start_time", -1).to_list(5)
    # Recommended window: find 4-hour window with lowest avg demand for user's zone
    forecasts = await db.forecasts.find({"zone_id": user["zone_id"]}, {"_id": 0}).to_list(100) if user.get("zone_id") else []
    recommendation = None
    if forecasts:
        forecasts.sort(key=lambda f: f["forecast_hour"])
        best_h = 0; best_avg = 1e9
        for h in range(24):
            window = [f["predicted_demand_kw"] for f in forecasts if h <= f["forecast_hour"] < h + 4 or (h + 4 > 24 and (f["forecast_hour"] >= h or f["forecast_hour"] < (h + 4) % 24))]
            if window:
                avg = sum(window) / len(window)
                if avg < best_avg:
                    best_avg = avg; best_h = h
        zone_name = zone["name"] if zone else ""
        recommendation = {
            "start_hour": best_h,
            "end_hour": (best_h + 4) % 24,
            "reason": f"Grid load in {zone_name} drops to ~{int(best_avg / (zone['grid_capacity_kw'] if zone else 1) * 100)}% during this window — ideal for off-peak charging.",
            "savings_inr": random.randint(15, 45),
        }
    return {"zone": zone, "recent_sessions": sessions, "recommendation": recommendation,
            "cost_now_inr": random.randint(180, 260), "cost_recommended_inr": random.randint(110, 170)}

@api.post("/customer/plan")
async def planner(data: PlannerIn, user: dict = Depends(require_customer)):
    forecasts = await db.forecasts.find({"zone_id": user["zone_id"]}, {"_id": 0}).to_list(100)
    zone = await db.zones.find_one({"id": user["zone_id"]}, {"_id": 0})
    if not forecasts or not zone:
        raise HTTPException(400, "No forecast available")
    forecasts.sort(key=lambda f: f["forecast_hour"])
    win = max(2, min(data.hours_available, 8))
    best_h = 0; best_avg = 1e9
    for h in range(24):
        vals = []
        for offset in range(win):
            hh = (h + offset) % 24
            v = next((f["predicted_demand_kw"] for f in forecasts if f["forecast_hour"] == hh), None)
            if v is not None:
                vals.append(v)
        if vals:
            avg = sum(vals) / len(vals)
            if avg < best_avg:
                best_avg = avg; best_h = h
    pct = int(best_avg / zone["grid_capacity_kw"] * 100)
    return {
        "start_hour": best_h,
        "end_hour": (best_h + win) % 24,
        "duration_hours": win,
        "expected_load_pct": pct,
        "reason": f"Grid load in {zone['name']} averages {pct}% during {best_h:02d}:00 – {(best_h + win) % 24:02d}:00. Charging during this window saves ~₹{random.randint(20, 50)}.",
        "savings_inr": random.randint(15, 50),
        "target_pct": data.target_pct,
    }

@api.post("/customer/plan/accept")
async def planner_accept(user: dict = Depends(require_customer)):
    return {"ok": True, "message": "Schedule accepted. We will charge during your off-peak window."}

@api.get("/customer/stations")
async def customer_stations(user: dict = Depends(require_customer)):
    stations = await db.stations.find({"zone_id": user["zone_id"]}, {"_id": 0}).to_list(50)
    for s in stations:
        s["wait_minutes"] = 0 if s["status"] == "idle" else (10 if s["status"] == "active" else 35)
    return stations

@api.put("/customer/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(require_customer)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return clean_user(fresh)

# Admin
@api.get("/admin/overview")
async def admin_overview(user: dict = Depends(require_admin)):
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)
    total_cap = sum(z["grid_capacity_kw"] for z in zones)
    total_load = sum(z["current_load_kw"] for z in zones)
    stations = await db.stations.find({}, {"_id": 0}).to_list(500)
    avg_util = round(sum(s["current_utilization_pct"] for s in stations) / max(len(stations), 1), 1)
    active_alerts = await db.events.count_documents({"resolved": False})
    for z in zones:
        pct = (z["current_load_kw"] / z["grid_capacity_kw"]) * 100
        z["load_pct"] = round(pct, 1)
        z["stress"] = "critical" if pct >= 90 else "high" if pct >= 75 else "medium" if pct >= 55 else "low"
    recent = await db.events.find({}, {"_id": 0}).sort("created_at", -1).to_list(8)
    return {
        "total_load_kw": total_load,
        "total_capacity_kw": total_cap,
        "load_pct": round(total_load / total_cap * 100, 1),
        "ev_demand_pct": round(random.uniform(28, 38), 1),
        "active_alerts": active_alerts,
        "avg_utilization_pct": avg_util,
        "zones": zones,
        "recent_events": recent,
    }

@api.get("/admin/forecast/{zone_id}")
async def admin_forecast(zone_id: str, user: dict = Depends(require_admin)):
    forecasts = await db.forecasts.find({"zone_id": zone_id}, {"_id": 0}).to_list(100)
    forecasts.sort(key=lambda f: f["forecast_hour"])
    zone = await db.zones.find_one({"id": zone_id}, {"_id": 0})
    if not zone:
        raise HTTPException(404, "Zone not found")
    avg = sum(f["predicted_demand_kw"] for f in forecasts) / max(len(forecasts), 1)
    peak = max(forecasts, key=lambda f: f["predicted_demand_kw"])
    low = min(forecasts, key=lambda f: f["predicted_demand_kw"])
    insight = (
        f"Peak demand of {peak['predicted_demand_kw']} kW expected at {peak['forecast_hour']:02d}:00 — "
        f"{round((peak['predicted_demand_kw'] - avg) / avg * 100)}% above average. "
        f"Lowest demand at {low['forecast_hour']:02d}:00 ({low['predicted_demand_kw']} kW). "
        f"Recommend shifting EV charging loads to {low['forecast_hour']:02d}:00–{(low['forecast_hour'] + 4) % 24:02d}:00 window."
    )
    day = sum(f["predicted_demand_kw"] for f in forecasts if 6 <= f["forecast_hour"] < 18) / 12
    night = sum(f["predicted_demand_kw"] for f in forecasts if f["forecast_hour"] < 6 or f["forecast_hour"] >= 18) / 12
    return {"zone": zone, "forecasts": forecasts, "insight": insight,
            "day_avg": round(day, 1), "night_avg": round(night, 1)}

@api.get("/admin/schedules")
async def admin_schedules(user: dict = Depends(require_admin),
                          zone_id: Optional[str] = None,
                          status: Optional[str] = None):
    q = {}
    if zone_id: q["zone_id"] = zone_id
    if status: q["status"] = status
    items = await db.schedules.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    pending = [s for s in items if s["status"] == "pending"]
    impact = sum(s["load_shift_kw"] for s in pending)
    return {"schedules": items, "pending_impact_kw": impact}

@api.post("/admin/schedules/action")
async def schedule_action(data: ScheduleAction, user: dict = Depends(require_admin)):
    new_status = "accepted" if data.action == "accept" else "rejected"
    res = await db.schedules.update_one({"id": data.schedule_id}, {"$set": {"status": new_status}})
    if res.matched_count == 0:
        raise HTTPException(404, "Schedule not found")
    return {"ok": True, "status": new_status}

@api.post("/admin/schedules/bulk")
async def schedules_bulk(data: BulkAction, user: dict = Depends(require_admin)):
    new_status = "accepted" if data.action == "accept" else "rejected"
    res = await db.schedules.update_many({"id": {"$in": data.schedule_ids}}, {"$set": {"status": new_status}})
    return {"ok": True, "updated": res.modified_count, "status": new_status}

@api.get("/admin/events")
async def admin_events(user: dict = Depends(require_admin),
                       severity: Optional[str] = None,
                       zone_id: Optional[str] = None,
                       resolved: Optional[bool] = None):
    q = {}
    if severity: q["severity"] = severity
    if zone_id: q["zone_id"] = zone_id
    if resolved is not None: q["resolved"] = resolved
    events = await db.events.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Severity distribution
    dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for e in events:
        dist[e["severity"]] = dist.get(e["severity"], 0) + 1
    # Trend last 7 days
    trend = {}
    for i in range(7):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).date().isoformat()
        trend[d] = 0
    for e in events:
        d = e["created_at"][:10]
        if d in trend:
            trend[d] += 1
    return {"events": events, "distribution": dist,
            "trend": [{"date": k, "count": v} for k, v in sorted(trend.items())]}

@api.post("/admin/events/{event_id}/resolve")
async def resolve_event(event_id: str, user: dict = Depends(require_admin)):
    res = await db.events.update_one({"id": event_id}, {"$set": {"resolved": True}})
    if res.matched_count == 0:
        raise HTTPException(404, "Event not found")
    return {"ok": True}

@api.get("/admin/customers")
async def admin_customers(user: dict = Depends(require_admin),
                          zone_id: Optional[str] = None,
                          ev_model: Optional[str] = None):
    q = {"role": "customer"}
    if zone_id: q["zone_id"] = zone_id
    if ev_model: q["ev_model"] = ev_model
    customers = await db.users.find(q, {"_id": 0, "password_hash": 0}).to_list(500)
    # Add zone names
    zones = {z["id"]: z["name"] for z in await db.zones.find({}, {"_id": 0}).to_list(100)}
    for c in customers:
        c["zone_name"] = zones.get(c.get("zone_id", ""), "—")
    # Stats
    zone_counts = {}
    for c in customers:
        zone_counts[c.get("zone_name", "—")] = zone_counts.get(c.get("zone_name", "—"), 0) + 1
    most_active = max(zone_counts.items(), key=lambda x: x[1])[0] if zone_counts else "—"
    return {"customers": customers, "total": len(customers), "most_active_zone": most_active}

@api.get("/admin/customer/{customer_id}/sessions")
async def admin_customer_sessions(customer_id: str, user: dict = Depends(require_admin)):
    sessions = await db.sessions.find({"user_id": customer_id}, {"_id": 0}).sort("start_time", -1).to_list(50)
    return sessions

@api.get("/admin/reports")
async def admin_reports(user: dict = Depends(require_admin)):
    zones = await db.zones.find({}, {"_id": 0}).to_list(100)
    weekly = []
    for i in range(7):
        d = (datetime.now(timezone.utc) - timedelta(days=6 - i)).strftime("%a")
        grid = sum(z["current_load_kw"] for z in zones) * random.uniform(0.85, 1.1)
        ev = grid * random.uniform(0.25, 0.38)
        weekly.append({"day": d, "grid_load_kw": round(grid, 0), "ev_load_kw": round(ev, 0)})
    return {
        "monthly_growth_pct": round(random.uniform(8.5, 14.2), 1),
        "peak_reduction_kw": random.randint(280, 480),
        "managed_revenue_inr": random.randint(180000, 260000),
        "weekly": weekly,
    }

# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email")
    await db.users.create_index("employee_id")
    await db.zones.create_index("name")
    await seed_data()
    logger.info("GridSense AI started — DB seeded")

@app.on_event("shutdown")
async def shutdown():
    client.close()
