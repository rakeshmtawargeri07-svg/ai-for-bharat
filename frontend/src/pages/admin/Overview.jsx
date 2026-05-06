import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Activity, AlertTriangle, BatteryCharging, Zap } from "lucide-react";

export default function Overview() {
    const [d, setD] = useState(null);
    useEffect(() => { api.get("/admin/overview").then(r => setD(r.data)); }, []);
    if (!d) return <div className="text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6" data-testid="admin-overview">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Live Grid Overview</h1>
                <p className="text-sm text-gray-600">Real-time status of Bengaluru's electricity grid and EV demand.</p>
            </header>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Total Grid Load" value={`${(d.total_load_kw / 1000).toFixed(1)} MW`} sub={`${d.load_pct}% of capacity`} icon={Activity} />
                <Stat label="EV Demand Share" value={`${d.ev_demand_pct}%`} sub="of total load" icon={BatteryCharging} />
                <Stat label="Active Alerts" value={d.active_alerts} sub="unresolved events" icon={AlertTriangle} />
                <Stat label="Charger Utilization" value={`${d.avg_utilization_pct}%`} sub="city-wide average" icon={Zap} accent />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="gs-card lg:col-span-2">
                    <div className="gs-card-header">Zone-wise Grid Stress</div>
                    <div className="overflow-x-auto">
                        <table className="gs-table" data-testid="zone-stress-table">
                            <thead>
                                <tr><th>Zone</th><th>Type</th><th>Capacity</th><th>Load</th><th>Utilization</th><th>Stress</th></tr>
                            </thead>
                            <tbody>
                                {d.zones.map(z => (
                                    <tr key={z.id}>
                                        <td className="font-semibold text-[var(--gs-blue)]">{z.name}</td>
                                        <td className="capitalize text-gray-600 text-xs">{z.zone_type}</td>
                                        <td className="font-mono">{z.grid_capacity_kw} kW</td>
                                        <td className="font-mono">{z.current_load_kw} kW</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                                                    <div style={{ width: `${z.load_pct}%`, background: z.stress === "critical" ? "var(--gs-danger)" : z.stress === "high" ? "var(--gs-warning)" : z.stress === "medium" ? "#b8860b" : "var(--gs-success)" }} className="h-full" />
                                                </div>
                                                <span className="font-mono text-xs">{z.load_pct}%</span>
                                            </div>
                                        </td>
                                        <td><span className={`pill pill-${z.stress}`}>{z.stress}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="gs-card">
                    <div className="gs-card-header">Recent Grid Events</div>
                    <div className="divide-y divide-[var(--gs-grey-border)] max-h-[420px] overflow-y-auto">
                        {d.recent_events.map(e => (
                            <div key={e.id} className="p-4 hover:bg-[var(--gs-grey-bg)]">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="text-sm font-medium text-[var(--gs-blue)]">{e.zone_name}</div>
                                    <span className={`pill pill-${e.severity}`}>{e.severity}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{e.message}</div>
                                <div className="text-xs text-gray-400 mt-1 font-mono">{new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, sub, icon: Icon, accent }) {
    return (
        <div className="gs-stat">
            <div className="gs-stat-header flex items-center justify-between" style={accent ? { background: "var(--gs-saffron)", color: "#1f2937" } : {}}>
                <span>{label}</span><Icon className="w-3.5 h-3.5" />
            </div>
            <div className="gs-stat-body">
                <div className="gs-stat-value">{value}</div>
                {sub && <div className="gs-stat-label">{sub}</div>}
            </div>
        </div>
    );
}
