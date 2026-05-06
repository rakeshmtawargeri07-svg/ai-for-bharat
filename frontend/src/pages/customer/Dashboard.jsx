import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Activity, BadgeIndianRupee, Clock, Sparkles } from "lucide-react";

export default function CustomerDashboard() {
    const [d, setD] = useState(null);
    useEffect(() => { api.get("/customer/dashboard").then(r => setD(r.data)); }, []);

    if (!d) return <div className="text-gray-500" data-testid="dashboard-loading">Loading dashboard...</div>;

    const z = d.zone;
    const stressClass = z ? `pill-${z.stress}` : "pill-low";
    const fmt = h => `${String(h).padStart(2, "0")}:00`;

    return (
        <div className="space-y-6" data-testid="customer-dashboard">
            <header className="animate-fade-up">
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Welcome back</h1>
                <p className="text-sm text-gray-600">Here's the grid status in {z?.name || "your zone"} today.</p>
            </header>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Zone Load" value={`${z?.load_pct ?? 0}%`} sub={z?.name} icon={Activity} />
                <Stat label="Grid Stress"
                    valueNode={<span className={`pill ${stressClass}`} data-testid="zone-stress">{z?.stress?.toUpperCase()}</span>}
                    sub={`${z?.current_load_kw}/${z?.grid_capacity_kw} kW`} icon={Sparkles} />
                <Stat label="Cost If Charged Now" value={`₹${d.cost_now_inr}`} sub="Approx · 30 kWh" icon={BadgeIndianRupee} />
                <Stat label="Cost (Off-peak)" value={`₹${d.cost_recommended_inr}`} sub={`Save ₹${d.cost_now_inr - d.cost_recommended_inr}`} icon={BadgeIndianRupee} accent />
            </div>

            {d.recommendation && (
                <div className="gs-card animate-fade-up delay-1">
                    <div className="gs-card-header flex items-center gap-2"><Clock className="w-4 h-4" /> AI-Recommended Charging Window</div>
                    <div className="p-6 grid md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-1">
                            <div className="text-5xl font-bold text-[var(--gs-blue)] font-mono">
                                {fmt(d.recommendation.start_hour)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">to {fmt(d.recommendation.end_hour)}</div>
                            <div className="mt-3 inline-block bg-[var(--gs-saffron)] text-[var(--gs-blue)] text-xs font-bold px-3 py-1 rounded">
                                SAVE ₹{d.recommendation.savings_inr}
                            </div>
                        </div>
                        <div className="md:col-span-2 text-sm text-gray-700 leading-relaxed border-l-4 border-[var(--gs-saffron)] pl-4">
                            {d.recommendation.reason}
                        </div>
                    </div>
                </div>
            )}

            <div className="gs-card animate-fade-up delay-2">
                <div className="gs-card-header">Recent Charging Sessions</div>
                <div className="overflow-x-auto">
                    <table className="gs-table" data-testid="recent-sessions-table">
                        <thead>
                            <tr><th>Date</th><th>Station</th><th>Energy</th><th>Cost</th><th>Off-peak</th></tr>
                        </thead>
                        <tbody>
                            {d.recent_sessions.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-6">No sessions yet.</td></tr>}
                            {d.recent_sessions.map(s => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs">{new Date(s.start_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                                    <td>{s.station_name}</td>
                                    <td className="font-mono">{s.energy_consumed_kwh} kWh</td>
                                    <td className="font-mono">₹{s.cost_inr}</td>
                                    <td>{s.schedule_followed ? <span className="pill pill-low">Yes</span> : <span className="pill pill-rejected">No</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, valueNode, sub, icon: Icon, accent }) {
    return (
        <div className="gs-stat animate-fade-up">
            <div className="gs-stat-header flex items-center justify-between" style={accent ? { background: "var(--gs-saffron)", color: "#1f2937" } : {}}>
                <span>{label}</span><Icon className="w-3.5 h-3.5" />
            </div>
            <div className="gs-stat-body">
                {valueNode || <div className="gs-stat-value">{value}</div>}
                {sub && <div className="gs-stat-label">{sub}</div>}
            </div>
        </div>
    );
}
