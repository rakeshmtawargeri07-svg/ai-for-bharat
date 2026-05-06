"""GridSense AI backend API tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bescom-power.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/auth/admin-login", json={"employee_id": "EMP001", "password": "bescom@123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def customer_token(s):
    r = s.post(f"{API}/auth/login", json={"email": "demo@gridsense.in", "password": "demo@123"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Health & zones ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_zones(s):
    r = s.get(f"{API}/zones")
    assert r.status_code == 200
    z = r.json()
    assert isinstance(z, list) and len(z) == 8
    assert all("stress" in x and "load_pct" in x for x in z)


# ---------- Auth ----------
def test_admin_login_success(s):
    r = s.post(f"{API}/auth/admin-login", json={"employee_id": "EMP001", "password": "bescom@123"})
    assert r.status_code == 200
    j = r.json()
    assert j["user"]["role"] == "admin"
    assert "token" in j and len(j["token"]) > 20
    # cookie set?
    assert any(c.name == "access_token" for c in r.cookies) or "access_token" in r.headers.get("set-cookie", "")


def test_admin_login_wrong(s):
    r = s.post(f"{API}/auth/admin-login", json={"employee_id": "EMP001", "password": "wrong"})
    assert r.status_code == 401


def test_customer_login(s):
    r = s.post(f"{API}/auth/login", json={"email": "demo@gridsense.in", "password": "demo@123"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "customer"


def test_register_new_customer(s):
    zr = s.get(f"{API}/zones").json()
    zid = zr[0]["id"]
    email = f"TEST_{uuid.uuid4().hex[:10]}@example.com"
    payload = {"name": "Test User", "email": email, "phone": "+91 9999999999",
               "password": "Pass@123", "ev_model": "Tata Nexon EV", "zone_id": zid}
    r = s.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["email"].lower() == email.lower()


def test_me_authed(s, customer_token):
    r = s.get(f"{API}/auth/me", headers=H(customer_token))
    assert r.status_code == 200
    assert r.json()["role"] == "customer"


def test_me_unauthed(s):
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------- Customer endpoints ----------
def test_customer_dashboard(s, customer_token):
    r = s.get(f"{API}/customer/dashboard", headers=H(customer_token))
    assert r.status_code == 200
    j = r.json()
    assert "zone" in j and "recent_sessions" in j and "recommendation" in j


def test_customer_plan(s, customer_token):
    r = s.post(f"{API}/customer/plan", json={"target_pct": 80, "hours_available": 4},
               headers=H(customer_token))
    assert r.status_code == 200
    j = r.json()
    assert "start_hour" in j and "duration_hours" in j


def test_customer_stations(s, customer_token):
    r = s.get(f"{API}/customer/stations", headers=H(customer_token))
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)


def test_customer_profile_update(s, customer_token):
    r = s.put(f"{API}/customer/profile", json={"phone": "+91 9000000001"},
              headers=H(customer_token))
    assert r.status_code == 200
    assert r.json()["phone"] == "+91 9000000001"


def test_customer_endpoint_blocks_admin(admin_token):
    r = requests.get(f"{API}/customer/dashboard", headers=H(admin_token))
    assert r.status_code == 403


# ---------- Admin endpoints ----------
def test_admin_overview(s, admin_token):
    r = s.get(f"{API}/admin/overview", headers=H(admin_token))
    assert r.status_code == 200
    j = r.json()
    for k in ("total_load_kw", "total_capacity_kw", "zones", "recent_events"):
        assert k in j


def test_admin_forecast(s, admin_token):
    zones = s.get(f"{API}/zones").json()
    r = s.get(f"{API}/admin/forecast/{zones[0]['id']}", headers=H(admin_token))
    assert r.status_code == 200
    j = r.json()
    assert len(j["forecasts"]) == 24


def test_admin_schedules_and_action(s, admin_token):
    r = s.get(f"{API}/admin/schedules", headers=H(admin_token))
    assert r.status_code == 200
    items = r.json()["schedules"]
    assert len(items) > 0
    pending = [x for x in items if x["status"] == "pending"]
    if pending:
        sid = pending[0]["id"]
        r2 = s.post(f"{API}/admin/schedules/action",
                    json={"schedule_id": sid, "action": "accept"}, headers=H(admin_token))
        assert r2.status_code == 200
        assert r2.json()["status"] == "accepted"


def test_admin_schedules_bulk(s, admin_token):
    items = s.get(f"{API}/admin/schedules", headers=H(admin_token)).json()["schedules"]
    ids = [x["id"] for x in items[:2]]
    r = s.post(f"{API}/admin/schedules/bulk",
               json={"schedule_ids": ids, "action": "accept"}, headers=H(admin_token))
    assert r.status_code == 200
    assert "updated" in r.json()


def test_admin_events_filters(s, admin_token):
    r = s.get(f"{API}/admin/events?severity=high", headers=H(admin_token))
    assert r.status_code == 200
    j = r.json()
    assert all(e["severity"] == "high" for e in j["events"])
    assert "distribution" in j and "trend" in j


def test_admin_event_resolve(s, admin_token):
    j = s.get(f"{API}/admin/events?resolved=false", headers=H(admin_token)).json()
    if j["events"]:
        eid = j["events"][0]["id"]
        r = s.post(f"{API}/admin/events/{eid}/resolve", headers=H(admin_token))
        assert r.status_code == 200


def test_admin_customers(s, admin_token):
    r = s.get(f"{API}/admin/customers", headers=H(admin_token))
    assert r.status_code == 200
    j = r.json()
    assert j["total"] >= 12
    assert all("password_hash" not in c for c in j["customers"])


def test_admin_customer_sessions(s, admin_token):
    cs = s.get(f"{API}/admin/customers", headers=H(admin_token)).json()["customers"]
    demo = next((c for c in cs if c["email"] == "demo@gridsense.in"), cs[0])
    r = s.get(f"{API}/admin/customer/{demo['id']}/sessions", headers=H(admin_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_admin_reports(s, admin_token):
    r = s.get(f"{API}/admin/reports", headers=H(admin_token))
    assert r.status_code == 200
    assert len(r.json()["weekly"]) == 7


def test_admin_endpoint_blocks_customer(customer_token):
    # Use fresh session so admin cookie from shared session doesn't leak in
    r = requests.get(f"{API}/admin/overview", headers=H(customer_token))
    assert r.status_code == 403
