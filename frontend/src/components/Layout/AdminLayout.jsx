import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Activity, AlertTriangle, BarChart3, CalendarClock, FileText, LogOut, Map, Users, Zap } from "lucide-react";

export default function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => { await logout(); navigate("/"); };

    const links = [
        { to: "/admin", end: true, icon: Activity, label: "Live Grid" },
        { to: "/admin/forecast", icon: BarChart3, label: "Demand Forecast" },
        { to: "/admin/schedules", icon: CalendarClock, label: "Schedule Optimizer" },
        { to: "/admin/zones", icon: Map, label: "Zone Map" },
        { to: "/admin/events", icon: AlertTriangle, label: "Events & Alerts" },
        { to: "/admin/customers", icon: Users, label: "Customers" },
        { to: "/admin/reports", icon: FileText, label: "Reports" },
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <div className="tricolor-bar" />
            <header className="gs-navbar" data-testid="admin-navbar">
                <Link to="/admin" className="flex items-center gap-3">
                    <div className="bg-[var(--gs-saffron)] rounded p-2">
                        <Zap className="w-5 h-5 text-[var(--gs-blue)]" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-white font-bold leading-tight tracking-wide">GridSense AI</div>
                        <div className="text-white/70 text-[11px] leading-tight">BESCOM · Control Centre</div>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right text-white">
                        <div className="text-sm font-medium" data-testid="admin-name">{user?.name}</div>
                        <div className="text-[11px] opacity-75">Employee ID: {user?.employee_id}</div>
                    </div>
                    <button onClick={handleLogout} className="btn-gov btn-gov-saffron" data-testid="logout-btn">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </header>

            <div className="flex-1 flex">
                <aside className="gs-sidebar hidden md:block" data-testid="admin-sidebar">
                    <div className="py-2">
                        {links.map(l => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.end}
                                data-testid={`sidebar-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                                className={({ isActive }) => isActive ? "active" : ""}>
                                <l.icon className="w-4 h-4" />
                                <span>{l.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
            </div>

            <footer className="bg-[var(--gs-blue-dark)] text-white/70 py-4 text-center text-xs">
                GridSense AI · BESCOM Internal Tool · Restricted Access
            </footer>
        </div>
    );
}
