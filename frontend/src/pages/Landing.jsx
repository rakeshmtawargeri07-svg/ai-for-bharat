import { Link } from "react-router-dom";
import { Zap, Building2, User, ShieldCheck, Activity, TrendingDown, Map } from "lucide-react";

export default function Landing() {
    return (
        <div className="min-h-screen bg-white">
            <div className="tricolor-bar" />

            {/* Header */}
            <header className="bg-[var(--gs-blue)] text-white">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-[var(--gs-saffron)] rounded p-2">
                            <Zap className="w-6 h-6 text-[var(--gs-blue)]" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-lg font-bold tracking-wide">GridSense AI</div>
                            <div className="text-xs text-white/70">A BESCOM Digital Initiative</div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs text-white/80">
                        <span>Government of Karnataka</span>
                        <span className="opacity-50">·</span>
                        <span>Bangalore Electricity Supply Company</span>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="border-b border-[var(--gs-grey-border)]" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%)" }}>
                <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-up">
                        <div className="inline-flex items-center gap-2 bg-[var(--gs-blue)]/5 border border-[var(--gs-blue)]/20 px-3 py-1 rounded text-xs font-semibold text-[var(--gs-blue)] mb-5">
                            <ShieldCheck className="w-3.5 h-3.5" /> SECURE GOVERNMENT PORTAL
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--gs-blue)] leading-tight tracking-tight">
                            Intelligent EV Grid Management for Bangalore
                        </h1>
                        <p className="mt-5 text-base lg:text-lg text-gray-600 leading-relaxed max-w-xl">
                            Real-time grid monitoring, AI-powered demand forecasting and smart charging optimization —
                            built for BESCOM operators and EV owners across Bengaluru.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Link to="/login/customer" data-testid="login-customer-btn"
                                className="btn-gov btn-gov-primary text-base">
                                <User className="w-4 h-4" /> Login as Customer
                            </Link>
                            <Link to="/login/admin" data-testid="login-admin-btn"
                                className="btn-gov btn-gov-secondary text-base">
                                <Building2 className="w-4 h-4" /> BESCOM Admin Login
                            </Link>
                        </div>

                        <div className="mt-6 text-xs text-gray-500">
                            New customer? <Link to="/register" className="text-[var(--gs-blue)] font-semibold underline" data-testid="register-link">Register your EV here</Link>
                        </div>
                    </div>

                    {/* Stat Panel */}
                    <div className="grid grid-cols-2 gap-4 animate-fade-up delay-2">
                        {[
                            { v: "8", l: "Active Zones", icon: Map },
                            { v: "12.5K", l: "kW Managed", icon: Activity },
                            { v: "₹2.4 L", l: "Monthly Savings", icon: TrendingDown },
                            { v: "94%", l: "Forecast Accuracy", icon: ShieldCheck },
                        ].map((s, i) => (
                            <div key={i} className="gs-stat">
                                <div className="gs-stat-header flex items-center justify-between">
                                    <span>{s.l}</span>
                                    <s.icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="gs-stat-body">
                                    <div className="gs-stat-value">{s.v}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature strip */}
            <section className="max-w-6xl mx-auto px-6 py-14">
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { t: "Live Grid Intelligence", d: "Track load, stress and EV demand across all 8 Bengaluru zones in real-time." },
                        { t: "AI Demand Forecasting", d: "24-hour predictive models help BESCOM pre-empt peak loads with 94% confidence." },
                        { t: "Smart Off-Peak Charging", d: "Customers get personalised charging windows and save up to ₹50 per session." },
                    ].map((f, i) => (
                        <div key={i} className="gs-card p-6 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="w-10 h-10 rounded bg-[var(--gs-blue)] flex items-center justify-center mb-4">
                                <Zap className="w-5 h-5 text-[var(--gs-saffron)]" />
                            </div>
                            <h3 className="font-bold text-[var(--gs-blue)] text-lg">{f.t}</h3>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="bg-[var(--gs-blue-dark)] text-white/70 text-xs">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between gap-2">
                    <span>© BESCOM · Government of Karnataka · GridSense AI v1.0</span>
                    <span>For grid emergencies, call 1912</span>
                </div>
            </footer>
        </div>
    );
}
