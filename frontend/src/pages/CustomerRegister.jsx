import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { ArrowLeft, Zap } from "lucide-react";
import { toast } from "sonner";

const EV_MODELS = ["Tata Nexon EV", "MG ZS EV", "Hyundai Kona", "Mahindra XUV400", "Tata Tigor EV", "BYD Atto 3", "Ola S1 Pro"];

export default function CustomerRegister() {
    const { register, formatApiError } = useAuth();
    const navigate = useNavigate();
    const [zones, setZones] = useState([]);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", password: "",
        ev_model: EV_MODELS[0], zone_id: ""
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/zones").then(r => {
            setZones(r.data);
            setForm(f => ({ ...f, zone_id: r.data[0]?.id || "" }));
        });
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try {
            await register(form);
            toast.success("Account created. Welcome to GridSense!");
            navigate("/customer");
        } catch (e2) {
            const msg = formatApiError(e2.response?.data?.detail) || e2.message;
            setErr(msg); toast.error(msg);
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--gs-grey-bg)]">
            <div className="tricolor-bar" />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    <Link to="/" className="text-[var(--gs-blue)] inline-flex items-center gap-2 text-sm mb-6 font-medium" data-testid="back-home">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <div className="gs-card overflow-hidden">
                        <div className="bg-[var(--gs-blue)] text-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-[var(--gs-saffron)] rounded p-2">
                                    <Zap className="w-5 h-5 text-[var(--gs-blue)]" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Register Your EV</h1>
                                    <p className="text-xs text-white/70">Get started with smart charging.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="register-form">
                            <Field label="Full Name" required value={form.name} onChange={v => set("name", v)} testId="reg-name" />
                            <Field label="Phone" required value={form.phone} onChange={v => set("phone", v)} testId="reg-phone" placeholder="+91 ..." />
                            <Field label="Email" required type="email" value={form.email} onChange={v => set("email", v)} testId="reg-email" className="sm:col-span-2" />
                            <Field label="Password" required type="password" value={form.password} onChange={v => set("password", v)} testId="reg-password" className="sm:col-span-2" />

                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">EV Model</label>
                                <select value={form.ev_model} onChange={e => set("ev_model", e.target.value)} className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white" data-testid="reg-ev-model">
                                    {EV_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Home Zone</label>
                                <select value={form.zone_id} onChange={e => set("zone_id", e.target.value)} className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white" data-testid="reg-zone">
                                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                            </div>

                            {err && <div className="text-sm text-[var(--gs-danger)] bg-red-50 border border-red-200 rounded px-3 py-2 sm:col-span-2" data-testid="register-error">{err}</div>}

                            <button type="submit" disabled={busy} className="btn-gov btn-gov-primary w-full justify-center sm:col-span-2" data-testid="register-submit">
                                {busy ? "Creating account..." : "Create Account"}
                            </button>

                            <div className="text-center text-sm text-gray-600 sm:col-span-2">
                                Already have an account? <Link to="/login/customer" className="text-[var(--gs-blue)] font-semibold underline">Login</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", required, placeholder, className = "", testId }) {
    return (
        <div className={className}>
            <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
            <input type={type} required={required} value={value} placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                data-testid={testId}
                className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white" />
        </div>
    );
}
