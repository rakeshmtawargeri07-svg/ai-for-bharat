import { useState } from "react";
import api from "../../lib/api";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Planner() {
    const [target, setTarget] = useState(80);
    const [hours, setHours] = useState(4);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post("/customer/plan", { target_pct: target, hours_available: hours });
            setResult(data);
        } catch { toast.error("Could not generate plan."); }
        finally { setBusy(false); }
    };

    const accept = async () => {
        await api.post("/customer/plan/accept");
        toast.success("Schedule accepted. Off-peak charging activated.");
    };

    const reject = () => { setResult(null); toast("Recommendation dismissed."); };

    const fmt = h => `${String(h).padStart(2, "0")}:00`;

    return (
        <div className="space-y-6" data-testid="customer-planner">
            <header>
                <h1 className="text-2xl font-bold text-[var(--gs-blue)]">Smart Charging Planner</h1>
                <p className="text-sm text-gray-600">Tell us your needs — we'll find the cheapest, lowest-stress window for you.</p>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={submit} className="gs-card lg:col-span-1">
                    <div className="gs-card-header">Plan Your Charge</div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Target Charge: <span className="font-mono text-[var(--gs-blue)]">{target}%</span></label>
                            <input type="range" min="40" max="100" value={target} onChange={e => setTarget(Number(e.target.value))}
                                className="w-full accent-[var(--gs-blue)]" data-testid="target-slider" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Available Time: <span className="font-mono text-[var(--gs-blue)]">{hours}h</span></label>
                            <input type="range" min="2" max="8" value={hours} onChange={e => setHours(Number(e.target.value))}
                                className="w-full accent-[var(--gs-blue)]" data-testid="hours-slider" />
                        </div>
                        <button type="submit" disabled={busy} className="btn-gov btn-gov-primary w-full justify-center" data-testid="plan-submit">
                            <Sparkles className="w-4 h-4" /> {busy ? "Calculating..." : "Get Recommendation"}
                        </button>
                    </div>
                </form>

                <div className="lg:col-span-2">
                    {!result ? (
                        <div className="gs-card h-full flex items-center justify-center p-10 text-center text-gray-500">
                            Set your preferences and click "Get Recommendation" to see your AI-optimised charging window.
                        </div>
                    ) : (
                        <div className="gs-card animate-fade-up" data-testid="plan-result">
                            <div className="gs-card-header">Recommended Window</div>
                            <div className="p-8">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-bold font-mono text-[var(--gs-blue)]">{fmt(result.start_hour)}</span>
                                    <span className="text-gray-400 text-2xl">→</span>
                                    <span className="text-5xl font-bold font-mono text-[var(--gs-blue)]">{fmt(result.end_hour)}</span>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">{result.duration_hours} hour window · expected grid load {result.expected_load_pct}%</div>

                                <div className="mt-6 p-4 bg-[var(--gs-grey-bg)] border-l-4 border-[var(--gs-saffron)] rounded-r">
                                    <div className="text-xs uppercase font-semibold text-[var(--gs-blue)] mb-1">AI Insight</div>
                                    <div className="text-sm text-gray-700 leading-relaxed">{result.reason}</div>
                                </div>

                                <div className="mt-6 inline-block bg-[var(--gs-saffron)] text-[var(--gs-blue)] font-bold px-4 py-2 rounded">
                                    Estimated savings: ₹{result.savings_inr}
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button onClick={accept} className="btn-gov btn-gov-primary" data-testid="plan-accept">Accept Schedule</button>
                                    <button onClick={reject} className="btn-gov btn-gov-secondary" data-testid="plan-reject">Reject</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
