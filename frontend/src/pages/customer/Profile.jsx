import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const EV_MODELS = ["Tata Nexon EV", "MG ZS EV", "Hyundai Kona", "Mahindra XUV400", "Tata Tigor EV", "BYD Atto 3", "Ola S1 Pro"];

export default function Profile() {
    const { user, refresh } = useAuth();
    const [zones, setZones] = useState([]);
    const [form, setForm] = useState({ name: "", phone: "", ev_model: "", zone_id: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => { api.get("/zones").then(r => setZones(r.data)); }, []);
    useEffect(() => {
        if (user) setForm({ name: user.name, phone: user.phone || "", ev_model: user.ev_model, zone_id: user.zone_id });
    }, [user]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.put("/customer/profile", form);
            await refresh();
            toast.success("Profile updated");
        } catch { toast.error("Update failed"); }
        finally { setBusy(false); }
    };

    return (
        <div className="space-y-6" data-testid="profile-page">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">My Profile</h1>
                <p className="text-sm text-gray-600">Manage your account and EV details.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="gs-card lg:col-span-2">
                    <div className="gs-card-header">Personal Details</div>
                    <form onSubmit={submit} className="p-6 grid sm:grid-cols-2 gap-4">
                        <Field label="Name" value={form.name} onChange={v => set("name", v)} testId="prof-name" />
                        <Field label="Phone" value={form.phone} onChange={v => set("phone", v)} testId="prof-phone" />
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">EV Model</label>
                            <select value={form.ev_model} onChange={e => set("ev_model", e.target.value)} className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm" data-testid="prof-ev">
                                {EV_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Home Zone</label>
                            <select value={form.zone_id} onChange={e => set("zone_id", e.target.value)} className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm" data-testid="prof-zone">
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </div>
                        <button disabled={busy} type="submit" className="btn-gov btn-gov-primary sm:col-span-2 justify-center" data-testid="prof-save">
                            {busy ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>

                <div className="gs-card h-fit">
                    <div className="gs-card-header">Account Info</div>
                    <div className="p-6 space-y-3 text-sm">
                        <Row k="Email" v={user?.email} mono />
                        <Row k="Role" v={user?.role} />
                        <Row k="Member ID" v={user?.id?.slice(0, 8)} mono />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, testId }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} data-testid={testId}
                className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white" />
        </div>
    );
}
function Row({ k, v, mono }) {
    return <div className="flex justify-between border-b border-[var(--gs-grey-border)] pb-2"><span className="text-gray-500">{k}</span><span className={mono ? "font-mono" : ""}>{v}</span></div>;
}
