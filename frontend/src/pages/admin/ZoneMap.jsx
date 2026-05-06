import { useEffect, useState } from "react";
import api from "../../lib/api";
import { MapContainer, TileLayer, CircleMarker, Tooltip as LTooltip, Popup } from "react-leaflet";

const stressColor = (s) => s === "critical" ? "#c62828" : s === "high" ? "#e65100" : s === "medium" ? "#b8860b" : "#2e7d32";

export default function ZoneMap() {
    const [zones, setZones] = useState([]);
    useEffect(() => { api.get("/zones").then(r => setZones(r.data)); }, []);

    const top3 = [...zones].sort((a, b) => b.load_pct - a.load_pct).slice(0, 3);

    return (
        <div className="space-y-6" data-testid="admin-zonemap">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Zone Intelligence Map</h1>
                <p className="text-sm text-gray-600">Color-coded grid stress across Bengaluru zones.</p>
            </header>

            <div className="grid lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 gs-card overflow-hidden">
                    <div className="gs-card-header">Bengaluru Zones</div>
                    <div style={{ height: 540 }}>
                        <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {zones.map(z => (
                                <CircleMarker key={z.id} center={[z.lat, z.lng]}
                                    radius={Math.max(14, z.load_pct / 3)}
                                    pathOptions={{ color: stressColor(z.stress), fillColor: stressColor(z.stress), fillOpacity: 0.4, weight: 2 }}>
                                    <LTooltip permanent direction="top" offset={[0, -8]}>
                                        <strong>{z.name}</strong> · {z.load_pct}%
                                    </LTooltip>
                                    <Popup>
                                        <strong>{z.name}</strong><br />
                                        Capacity: {z.grid_capacity_kw} kW<br />
                                        Load: {z.current_load_kw} kW ({z.load_pct}%)<br />
                                        Chargers: {z.ev_charger_count}<br />
                                        Stress: <strong>{z.stress.toUpperCase()}</strong>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <div className="gs-card">
                        <div className="gs-card-header" style={{ background: "var(--gs-saffron)", color: "#1f2937" }}>Priority Zones</div>
                        <div className="p-4 space-y-3">
                            {top3.map((z, i) => (
                                <div key={z.id} className="border-l-4 pl-3 py-1" style={{ borderColor: stressColor(z.stress) }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-[var(--gs-blue)]">#{i + 1} {z.name}</div>
                                            <div className="text-xs text-gray-500 capitalize">{z.zone_type}</div>
                                        </div>
                                        <span className={`pill pill-${z.stress}`}>{z.load_pct}%</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        Recommended: <strong>+{Math.round(z.grid_capacity_kw * 0.15)} kW</strong> capacity expansion
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="gs-card">
                        <div className="gs-card-header">Legend</div>
                        <div className="p-4 space-y-2 text-sm">
                            {[["low", "< 55%"], ["medium", "55-75%"], ["high", "75-90%"], ["critical", "> 90%"]].map(([k, v]) => (
                                <div key={k} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ background: stressColor(k) }} />
                                    <span className="capitalize">{k}</span>
                                    <span className="text-gray-500 text-xs ml-auto">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
