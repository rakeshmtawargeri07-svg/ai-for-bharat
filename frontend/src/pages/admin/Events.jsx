import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { Check } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const COLORS = { low: "#2e7d32", medium: "#b8860b", high: "#e65100", critical: "#c62828" };

export default function Events() {
    const [zones, setZones] = useState([]);
    const [filter, setFilter] = useState({ severity: "", zone_id: "", resolved: "" });
    const [data, setData] = useState({ events: [], distribution: {}, trend: [] });

    const load = useCallback(() => {
        const params = {};
        if (filter.severity) params.severity = filter.severity;
        if (filter.zone_id) params.zone_id = filter.zone_id;
        if (filter.resolved !== "") params.resolved = filter.resolved === "true";
        api.get("/admin/events", { params }).then(r => setData(r.data));
    }, [filter]);

    useEffect(() => { api.get("/zones").then(r => setZones(r.data)); }, []);
    useEffect(() => { load(); }, [load]);

    const resolve = async (id) => {
        await api.post(`/admin/events/${id}/resolve`);
        toast.success("Event marked resolved");
        load();
    };

    const pieData = Object.entries(data.distribution).map(([k, v]) => ({ name: k, value: v }));

    return (
        <div className="space-y-6" data-testid="admin-events">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Grid Events & Alerts</h1>
                <p className="text-sm text-gray-600">Monitor and resolve grid stress events across Bengaluru.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="gs-card">
                    <div className="gs-card-header">Severity Distribution</div>
                    <div style={{ height: 240 }} className="bg-white">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                                    {pieData.map((e, i) => <Cell key={i} fill={COLORS[e.name] || "#999"} />)}
                                </Pie>
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="gs-card lg:col-span-2">
                    <div className="gs-card-header">Events Trend (Last 7 Days)</div>
                    <div style={{ height: 240 }} className="bg-white p-2">
                        <ResponsiveContainer>
                            <BarChart data={data.trend}>
                                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short" })} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ fontSize: 12 }} />
                                <Bar dataKey="count" fill="#1a3c6e" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="gs-card">
                <div className="gs-card-header flex items-center justify-between gap-3 flex-wrap">
                    <span>Events Log</span>
                    <div className="flex gap-2">
                        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal" data-testid="filter-severity">
                            <option value="">All Severity</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <select value={filter.zone_id} onChange={e => setFilter(f => ({ ...f, zone_id: e.target.value }))} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal">
                            <option value="">All Zones</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                        <select value={filter.resolved} onChange={e => setFilter(f => ({ ...f, resolved: e.target.value }))} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal">
                            <option value="">All</option>
                            <option value="false">Unresolved</option>
                            <option value="true">Resolved</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="gs-table">
                        <thead>
                            <tr><th>When</th><th>Zone</th><th>Type</th><th>Message</th><th>Severity</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            {data.events.map(e => (
                                <tr key={e.id}>
                                    <td className="font-mono text-xs">{new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                                    <td className="font-semibold">{e.zone_name}</td>
                                    <td className="text-xs capitalize">{e.event_type.replace("_", " ")}</td>
                                    <td className="text-xs text-gray-600">{e.message}</td>
                                    <td><span className={`pill pill-${e.severity}`}>{e.severity}</span></td>
                                    <td>{e.resolved ? <span className="pill pill-low">Resolved</span> : <span className="pill pill-pending">Open</span>}</td>
                                    <td>{!e.resolved && <button onClick={() => resolve(e.id)} className="btn-gov btn-gov-secondary text-xs py-1 px-2" data-testid={`resolve-${e.id}`}><Check className="w-3 h-3" /> Resolve</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
