import { useEffect, useState } from "react";
import api from "../../lib/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Stations() {
    const [stations, setStations] = useState([]);
    useEffect(() => { api.get("/customer/stations").then(r => setStations(r.data)); }, []);

    const center = stations[0] ? [stations[0].lat, stations[0].lng] : [12.9716, 77.5946];

    return (
        <div className="space-y-6" data-testid="stations-page">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Nearby Charging Stations</h1>
                <p className="text-sm text-gray-600">Stations in your zone with live status and wait times.</p>
            </header>

            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 gs-card overflow-hidden">
                    <div className="gs-card-header">Map View</div>
                    <div style={{ height: 480 }}>
                        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} data-testid="stations-map">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {stations.map(s => (
                                <Marker key={s.id} position={[s.lat, s.lng]}>
                                    <Popup>
                                        <strong>{s.name}</strong><br />
                                        {s.charger_type.toUpperCase()} · {s.status}<br />
                                        Utilization: {s.current_utilization_pct}%
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 gs-card">
                    <div className="gs-card-header">Stations ({stations.length})</div>
                    <div className="max-h-[480px] overflow-y-auto divide-y divide-[var(--gs-grey-border)]">
                        {stations.map(s => (
                            <div key={s.id} className="p-4 hover:bg-[var(--gs-grey-bg)]" data-testid={`station-${s.id}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="font-semibold text-[var(--gs-blue)]">{s.name}</div>
                                    <span className={`pill pill-${s.status}`}>{s.status}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 capitalize">{s.charger_type} charger</div>
                                <div className="flex justify-between mt-2 text-xs">
                                    <span className="font-mono">Util: {s.current_utilization_pct}%</span>
                                    <span className="text-gray-600">Wait: ~{s.wait_minutes} min</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
