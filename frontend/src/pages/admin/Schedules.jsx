import { useEffect, useState, useCallback } from "react";
import api from "../../lib/api";
import { Check, X, Layers } from "lucide-react";
import { toast } from "sonner";

export default function Schedules() {
    const [zones, setZones] = useState([]);
    const [zoneId, setZoneId] = useState("");
    const [status, setStatus] = useState("");
    const [data, setData] = useState({ schedules: [], pending_impact_kw: 0 });
    const [selected, setSelected] = useState({});

    const load = useCallback(() => {
        const params = {};
        if (zoneId) params.zone_id = zoneId;
        if (status) params.status = status;
        api.get("/admin/schedules", { params }).then(r => setData(r.data));
    }, [zoneId, status]);

    useEffect(() => { api.get("/zones").then(r => setZones(r.data)); }, []);
    useEffect(() => { load(); }, [load]);

    const act = async (id, action) => {
        await api.post("/admin/schedules/action", { schedule_id: id, action });
        toast.success(`Schedule ${action}ed`);
        load();
    };

    const bulkAccept = async () => {
        const ids = Object.keys(selected).filter(k => selected[k]);
        if (!ids.length) { toast.error("Select at least one schedule"); return; }
        await api.post("/admin/schedules/bulk", { schedule_ids: ids, action: "accept" });
        toast.success(`${ids.length} schedules approved`);
        setSelected({}); load();
    };

    const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));

    return (
        <div className="space-y-6" data-testid="admin-schedules">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Charging Schedule Optimizer</h1>
                <p className="text-sm text-gray-600">Review and approve AI-recommended off-peak charging schedules.</p>
            </header>

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="gs-stat">
                    <div className="gs-stat-header">Pending Impact</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">{data.pending_impact_kw} kW</div>
                        <div className="gs-stat-label">peak load reduction if approved</div>
                    </div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header">Total Schedules</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">{data.schedules.length}</div>
                        <div className="gs-stat-label">in current view</div>
                    </div>
                </div>
                <div className="gs-stat">
                    <div className="gs-stat-header" style={{ background: "var(--gs-saffron)", color: "#1f2937" }}>Pending</div>
                    <div className="gs-stat-body">
                        <div className="gs-stat-value">{data.schedules.filter(s => s.status === "pending").length}</div>
                        <div className="gs-stat-label">awaiting decision</div>
                    </div>
                </div>
            </div>

            <div className="gs-card">
                <div className="gs-card-header flex items-center justify-between gap-3 flex-wrap">
                    <span>Recommended Schedules</span>
                    <div className="flex gap-2 items-center">
                        <select value={zoneId} onChange={e => setZoneId(e.target.value)} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal" data-testid="filter-zone">
                            <option value="">All Zones</option>
                            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-white text-gray-800 text-xs rounded px-2 py-1 normal-case font-normal" data-testid="filter-status">
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button onClick={bulkAccept} className="btn-gov btn-gov-saffron text-xs py-1.5" data-testid="bulk-accept">
                            <Layers className="w-3.5 h-3.5" /> Bulk Approve
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="gs-table" data-testid="schedules-table">
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}></th>
                                <th>Station</th><th>Zone</th><th>Window</th><th>Load Shift</th><th>Reason</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.schedules.map(s => (
                                <tr key={s.id}>
                                    <td>{s.status === "pending" && <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)} data-testid={`select-${s.id}`} />}</td>
                                    <td className="font-semibold text-[var(--gs-blue)]">{s.station_name}</td>
                                    <td>{s.zone_name}</td>
                                    <td className="font-mono text-xs">{s.recommended_start} – {s.recommended_end}</td>
                                    <td className="font-mono">{s.load_shift_kw} kW</td>
                                    <td className="text-xs text-gray-600 max-w-xs">{s.reason}</td>
                                    <td><span className={`pill pill-${s.status}`}>{s.status}</span></td>
                                    <td>
                                        {s.status === "pending" && (
                                            <div className="flex gap-1">
                                                <button onClick={() => act(s.id, "accept")} className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-[var(--gs-success)]" data-testid={`accept-${s.id}`}><Check className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => act(s.id, "reject")} className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-[var(--gs-danger)]" data-testid={`reject-${s.id}`}><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
