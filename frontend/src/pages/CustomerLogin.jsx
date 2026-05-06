import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CustomerLogin() {
    const { loginCustomer, formatApiError } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("demo@gridsense.in");
    const [password, setPassword] = useState("demo@123");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr("");
        try {
            await loginCustomer(email, password);
            toast.success("Welcome back!");
            navigate("/customer");
        } catch (e2) {
            const msg = formatApiError(e2.response?.data?.detail) || e2.message;
            setErr(msg); toast.error(msg);
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="tricolor-bar" />
            <div className="flex-1 grid lg:grid-cols-2">
                <div className="hidden lg:flex flex-col justify-between p-10 bg-[var(--gs-blue)] text-white">
                    <Link to="/" className="text-white/80 hover:text-white inline-flex items-center gap-2 text-sm" data-testid="back-home">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div>
                        <div className="bg-[var(--gs-saffron)] inline-flex p-3 rounded mb-6">
                            <Zap className="w-6 h-6 text-[var(--gs-blue)]" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-4xl font-bold leading-tight">Welcome back, EV owner.</h2>
                        <p className="mt-4 text-white/80 max-w-md leading-relaxed">
                            Login to track your charging history, get AI-powered off-peak recommendations, and find nearby stations across Bengaluru.
                        </p>
                    </div>
                    <div className="text-xs text-white/60">A BESCOM Digital Initiative</div>
                </div>

                <div className="flex items-center justify-center p-6 bg-white">
                    <form onSubmit={submit} className="w-full max-w-md" data-testid="customer-login-form">
                        <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Customer Login</h1>
                        <p className="text-sm text-gray-600 mt-1">Sign in to your GridSense account.</p>

                        <div className="mt-8 space-y-5">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white"
                                    data-testid="customer-email-input" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full border border-[var(--gs-grey-border)] rounded px-3 py-2.5 text-sm bg-white"
                                    data-testid="customer-password-input" />
                            </div>

                            {err && <div className="text-sm text-[var(--gs-danger)] bg-red-50 border border-red-200 rounded px-3 py-2" data-testid="login-error">{err}</div>}

                            <button type="submit" disabled={busy} className="btn-gov btn-gov-primary w-full justify-center disabled:opacity-60" data-testid="customer-login-submit">
                                {busy ? "Signing in..." : "Sign In"}
                            </button>

                            <div className="text-center text-sm text-gray-600">
                                Don't have an account? <Link to="/register" className="text-[var(--gs-blue)] font-semibold underline">Register</Link>
                            </div>
                            <div className="text-xs text-gray-500 bg-[var(--gs-grey-bg)] p-3 rounded border border-[var(--gs-grey-border)]">
                                <strong>Demo:</strong> demo@gridsense.in / demo@123
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
