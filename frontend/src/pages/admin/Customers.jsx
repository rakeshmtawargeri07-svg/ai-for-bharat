import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";

const EV_MODELS = ["Tata Nexon EV", "MG ZS EV", "Hyundai Kona", "Mahindra XUV400", "Tata Tigor EV", "BYD Atto 3", "Ola S1 Pro"];

export default function Customers() {
    const [zones, setZones] = useState([]);
    const [filter, setFilter] = useState({ zone_id: "", ev_model: "" });
    const [data, setData] = useState({ customers: [], total: 0, most_active_zone: "" });
    const [selected, setSelected] = useState(null);
    const [sessions, setSessions] = useState([]);

    const load = useCallback(() => {
        const params = {};
        if (filter.zone_id) params.zone_id = filter.zone_id;
        if (filter.ev_model) params.ev_model = filter.ev_model;
        api.get("/admin/customers", { params }).then(r => setData(r.data));
    }, [filter]);

    useEffect(() => { api.get("/zones").then(r => setZones(r.data)); }, []);
    useEffect(() => { load(); }, [load]);

    const view = async (c) => {
        setSelected(c);
        const { data } = await api.get(`/admin/customer/${c.id}/sessions`);
        setSessions(data);
    };

    return (
        <div className="space-y-6" data-testid="admin-customers">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Customer Management</h1>
                <p className="text-sm text-gray-600">All registered EV owners across Bengaluru.</p>
            </header>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="gs-stat">
                    <div className="gs-stat-header">Total Customers</div>
                    <div className="gs-stat-body"><div className="gs-stat-value">{data.total}</div></div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header">Most Active Zone</div>
                    <div className="gs-stat-body"><div className="gs-stat-value text-2xl">{data.most_active_zone}</div></div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header" style={{ background: "var(--gs-saffron)", color: "#1f2937" }}>EV Adoption</div>
                    <div className="gs-stat-body"><div className="gs-stat-value">+12.4%</div><div className="gs-stat-label">month over month</div></div>
                </div>
            </div>

            <div className="gs-card">
                <div className="gs-card-header flex items-center justify-between gap-3 flex-wrap">
                    <span>Customer List</span>
                    <div className="flex gap-2">
                        <select value={filter.zone_id} onChange={e => setFilter(f => ({ ...f, zone_id: e.target.value }))} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal" data-testid="cust-filter-zone">
                            <option value="">All Zones</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                        <select value={filter.ev_model} onChange={e => setFilter(f => ({ ...f, ev_model: e.target.value }))} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal">
                            <option value="">All Models</option>
                            {EV_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="gs-table" data-testid="customers-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>EV Model</th><th>Zone</th><th></th></tr></thead>
                        <tbody>
                            {data.customers.map(c => (
                                <tr key={c.id}>
                                    <td className="font-semibold text-[var(--gs-blue)]">{c.name}</td>
                                    <td className="text-xs font-mono">{c.email}</td>
                                    <td className="text-xs font-mono">{c.phone || "—"}</td>
                                    <td>{c.ev_model || "—"}</td>
                                    <td>{c.zone_name}</td>
                                    <td><button onClick={() => view(c)} className="text-[var(--gs-blue)] underline text-xs" data-testid={`view-${c.id}`}>View History</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-[var(--gs-blue)] text-white p-4 flex justify-between">
                            <div>
                                <div className="font-bold">{selected.name}</div>
                                <div className="text-xs opacity-75">{selected.email} · {selected.zone_name}</div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white" data-testid="close-modal">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="text-sm font-semibold text-[var(--gs-blue)] mb-3">Charging History ({sessions.length})</div>
                            {sessions.length === 0 ? <div className="text-gray-500 text-sm">No sessions found.</div> : (
                                <table className="gs-table">
                                    <thead><tr><th>When</th><th>Station</th><th>Energy</th><th>Cost</th></tr></thead>
                                    <tbody>
                                        {sessions.map(s => (
                                            <tr key={s.id}>
                                                <td className="font-mono text-xs">{new Date(s.start_time).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                                                <td className="text-xs">{s.station_name}</td>
                                                <td className="font-mono">{s.energy_consumed_kwh} kWh</td>
                                                <td className="font-mono">₹{s.cost_inr}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
