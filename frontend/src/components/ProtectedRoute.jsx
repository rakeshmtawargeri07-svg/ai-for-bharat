import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role, children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" data-testid="auth-loading">
                <div className="text-[var(--gs-blue)] font-medium">Loading...</div>
            </div>
        );
    }
    if (!user) return <Navigate to="/" replace />;
    if (role && user.role !== role) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/customer"} replace />;
    }
    return children;
}
