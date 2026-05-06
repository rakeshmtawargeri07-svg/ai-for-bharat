import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = checking, false = not authed, object = authed
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const loginCustomer = async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data.token) localStorage.setItem("gs_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const loginAdmin = async (employee_id, password) => {
        const { data } = await api.post("/auth/admin-login", { employee_id, password });
        if (data.token) localStorage.setItem("gs_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data.token) localStorage.setItem("gs_token", data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch {}
        localStorage.removeItem("gs_token");
        setUser(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginCustomer, loginAdmin, register, logout, refresh, formatApiError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
