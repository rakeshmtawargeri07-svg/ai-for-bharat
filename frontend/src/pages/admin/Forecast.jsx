import { useEffect, useState } from "react";
import api from "../../lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Lightbulb } from "lucide-react";

export default function Forecast() {
    const [zones, setZones] = useState([]);
    const [zoneId, setZoneId] = useState("");
    const [d, setD] = useState(null);

    useEffect(() => { api.get("/zones").then(r => { setZones(r.data); setZoneId(r.data[0]?.id || ""); }); }, []);
    useEffect(() => {
        if (!zoneId) return;
        api.get(`/admin/forecast/${zoneId}`).then(r => setD(r.data));
    }, [zoneId]);

    const chartData = d?.forecasts.map(f => ({
        hour: `${String(f.forecast_hour).padStart(2, "0")}:00`,
        demand: f.predicted_demand_kw,
        upper: Math.round(f.predicted_demand_kw * (1 + (1 - f.confidence_score))),
        lower: Math.round(f.predicted_demand_kw * (1 - (1 - f.confidence_score))),
    })) || [];

    const dayNight = d ? [
        { period: "Day (06:00-18:00)", load: d.day_avg },
        { period: "Night (18:00-06:00)", load: d.night_avg },
    ] : [];

    return (
        <div className="space-y-6" data-testid="admin-forecast">
            <header className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--gs-blue)]">24-Hour Demand Forecast</h1>
                    <p className="text-sm text-gray-600">AI-predicted demand curve with confidence intervals.</p>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Select Zone</label>
                    <select value={zoneId} onChange={e => setZoneId(e.target.value)}
                        className="border border-[var(--gs-grey-border)] rounded px-3 py-2 text-sm bg-white min-w-[220px]" data-testid="zone-select">
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
            </header>

            {!d ? <div className="text-gray-500">Loading forecast...</div> : (
                <>
                    <div className="gs-card">
                        <div className="gs-card-header">Hourly Demand · {d.zone.name}</div>
                        <div className="p-4 bg-white" style={{ height: 380 }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="conf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#1a3c6e" stopOpacity={0.18} />
                                            <stop offset="100%" stopColor="#1a3c6e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#6b7280" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" label={{ value: "kW", angle: -90, position: "insideLeft", fontSize: 11 }} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderColor: "#1a3c6e" }} />
                                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#conf)" />
                                    <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" />
                                    <Line type="monotone" dataKey="demand" stroke="#1a3c6e" strokeWidth={2.5} dot={{ r: 3, fill: "#f5a623" }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="gs-card lg:col-span-2 bg-[var(--gs-blue)]/5 border-[var(--gs-blue)]/30">
                            <div className="gs-card-header flex items-center gap-2"><Lightbulb className="w-4 h-4" /> AI Insight</div>
                            <div className="p-6 text-sm text-gray-700 leading-relaxed border-l-4 border-[var(--gs-saffron)] bg-white">{d.insight}</div>
                        </div>

                        <div className="gs-card">
                            <div className="gs-card-header">Day vs Night</div>
                            <div className="p-4 bg-white" style={{ height: 240 }}>
                                <ResponsiveContainer>
                                    <BarChart data={dayNight}>
                                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                        <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ fontSize: 12 }} />
                                        <Bar dataKey="load" fill="#1a3c6e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
