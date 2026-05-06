import { useEffect, useState } from "react";
import api from "../../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
    const [d, setD] = useState(null);
    useEffect(() => { api.get("/admin/reports").then(r => setD(r.data)); }, []);

    const downloadCSV = () => {
        if (!d) return;
        const rows = [["Day", "Grid Load (kW)", "EV Load (kW)"]];
        d.weekly.forEach(w => rows.push([w.day, w.grid_load_kw, w.ev_load_kw]));
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "gridsense_weekly_report.csv"; a.click();
        URL.revokeObjectURL(url);
        toast.success("Report downloaded");
    };

    if (!d) return <div className="text-gray-500">Loading reports...</div>;

    return (
        <div className="space-y-6" data-testid="admin-reports">
            <header className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Reports</h1>
                    <p className="text-sm text-gray-600">Weekly summaries and key metrics.</p>
                </div>
                <button onClick={downloadCSV} className="btn-gov btn-gov-primary" data-testid="download-csv">
                    <Download className="w-4 h-4" /> Download CSV
                </button>
            </header>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="gs-stat">
                    <div className="gs-stat-header">Monthly EV Demand Growth</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">+{d.monthly_growth_pct}%</div>
                        <div className="gs-stat-label">vs last month</div>
                    </div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header">Peak Load Reduction</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">{d.peak_reduction_kw} kW</div>
                        <div className="gs-stat-label">via smart scheduling</div>
                    </div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header" style={{ background: "var(--gs-saffron)", color: "#1f2937" }}>Managed Charging Revenue</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">₹{d.managed_revenue_inr.toLocaleString("en-IN")}</div>
                        <div className="gs-stat-label">this month</div>
                    </div>
                </div>
            </div>

            <div className="gs-card">
                <div className="gs-card-header">Weekly Grid Load vs EV Contribution</div>
                <div className="bg-white p-4" style={{ height: 360 }}>
                    <ResponsiveContainer>
                        <BarChart data={d.weekly}>
                            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} label={{ value: "kW", angle: -90, position: "insideLeft", fontSize: 11 }} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="grid_load_kw" name="Grid Load" fill="#1a3c6e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ev_load_kw" name="EV Load" fill="#f5a623" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
