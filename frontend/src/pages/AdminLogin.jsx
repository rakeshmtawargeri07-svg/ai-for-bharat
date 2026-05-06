import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
    const { loginAdmin, formatApiError } = useAuth();
    const navigate = useNavigate();
    const [employee_id, setEmpId] = useState("EMP001");
    const [password, setPassword] = useState("bescom@123");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try {
            await loginAdmin(employee_id, password);
            toast.success("Authenticated. Welcome to the Control Centre.");
            navigate("/admin");
        } catch (e2) {
            const msg = formatApiError(e2.response?.data?.detail) || e2.message;
            setErr(msg); toast.error(msg);
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[var(--gs-grey-bg)]">
            <div className="tricolor-bar" />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Link to="/" className="text-[var(--gs-blue)] inline-flex items-center gap-2 text-sm mb-6 font-medium" data-testid="back-home">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>

                    <div className="gs-card overflow-hidden">
                        <div className="bg-[var(--gs-blue)] text-white p-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-[var(--gs-saffron)] rounded p-2">
                                    <ShieldCheck className="w-5 h-5 text-[var(--gs-blue)]" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">BESCOM Admin Login</h1>
                                    <p className="text-xs text-white/70">Restricted Access · Authorised Personnel Only</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-5" data-testid="admin-login-form">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Employee ID</label>
                                <input type="text" required value={employee_id} onChange={e => setEmpId(e.target.value.toUpperCase())}
                                    className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white font-mono"
                                    placeholder="EMP001"
                                    data-testid="admin-empid-input" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white"
                                    data-testid="admin-password-input" />
                            </div>

                            {err && <div className="text-sm text-[var(--gs-danger)] bg-red-50 border border-red-200 rounded px-3 py-2" data-testid="admin-login-error">{err}</div>}

                            <button type="submit" disabled={busy} className="btn-gov btn-gov-primary w-full justify-center" data-testid="admin-login-submit">
                                {busy ? "Authenticating..." : "Authenticate"}
                            </button>

                            <div className="text-xs text-gray-500 bg-[var(--gs-grey-bg)] p-3 rounded border border-[var(--gs-grey-border)]">
                                <strong>Demo:</strong> EMP001 / bescom@123 · EMP002 / admin@456
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
