import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Zap } from "lucide-react";

export default function CustomerLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const loc = useLocation();
    const handleLogout = async () => { await logout(); navigate("/"); };

    const tabs = [
        { to: "/customer", label: "Dashboard" },
        { to: "/customer/planner", label: "Smart Planner" },
        { to: "/customer/stations", label: "Nearby Stations" },
        { to: "/customer/profile", label: "My Profile" },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <div className="tricolor-bar" />
            <header className="gs-navbar" data-testid="customer-navbar">
                <Link to="/customer" className="flex items-center gap-3">
                    <div className="bg-[var(--gs-saffron)] rounded p-2">
                        <Zap className="w-5 h-5 text-[var(--gs-blue)]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-white font-bold leading-tight tracking-wide">GridSense AI</div>
                        <div className="text-white/70 text-[11px] leading-tight">BESCOM Customer Portal</div>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right text-white">
                        <div className="text-sm font-medium" data-testid="customer-name">{user?.name}</div>
                        <div className="text-[11px] opacity-75">{user?.ev_model}</div>
                    </div>
                    <button onClick={handleLogout} className="btn-gov btn-gov-saffron" data-testid="logout-btn">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </header>

            <nav className="bg-white border-b border-[var(--gs-grey-border)] px-6 overflow-x-auto">
                <div className="flex gap-1">
                    {tabs.map(t => {
                        const active = loc.pathname === t.to;
                        return (
                            <Link
                                key={t.to}
                                to={t.to}
                                data-testid={`tab-${t.to.replace("/customer", "").replace("/", "") || "dashboard"}`}
                                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    active ? "border-[var(--gs-saffron)] text-[var(--gs-blue)]" : "border-transparent text-gray-600 hover:text-[var(--gs-blue)]"
                                }`}>
                                {t.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>

            <footer className="bg-[var(--gs-blue-dark)] text-white/70 py-4 text-center text-xs">
                GridSense AI · A BESCOM Initiative · Government of Karnataka
            </footer>
        </div>
    );
}
