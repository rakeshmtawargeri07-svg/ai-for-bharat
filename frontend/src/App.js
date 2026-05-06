import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

import Landing from "./pages/Landing";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import AdminLogin from "./pages/AdminLogin";

import CustomerLayout from "./components/Layout/CustomerLayout";
import AdminLayout from "./components/Layout/AdminLayout";

import CustomerDashboard from "./pages/customer/Dashboard";
import Planner from "./pages/customer/Planner";
import Stations from "./pages/customer/Stations";
import Profile from "./pages/customer/Profile";

import Overview from "./pages/admin/Overview";
import Forecast from "./pages/admin/Forecast";
import Schedules from "./pages/admin/Schedules";
import ZoneMap from "./pages/admin/ZoneMap";
import Events from "./pages/admin/Events";
import Customers from "./pages/admin/Customers";
import Reports from "./pages/admin/Reports";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster position="top-right" richColors />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login/customer" element={<CustomerLogin />} />
                    <Route path="/login/admin" element={<AdminLogin />} />
                    <Route path="/register" element={<CustomerRegister />} />

                    <Route path="/customer" element={<ProtectedRoute role="customer"><CustomerLayout><CustomerDashboard /></CustomerLayout></ProtectedRoute>} />
                    <Route path="/customer/planner" element={<ProtectedRoute role="customer"><CustomerLayout><Planner /></CustomerLayout></ProtectedRoute>} />
                    <Route path="/customer/stations" element={<ProtectedRoute role="customer"><CustomerLayout><Stations /></CustomerLayout></ProtectedRoute>} />
                    <Route path="/customer/profile" element={<ProtectedRoute role="customer"><CustomerLayout><Profile /></CustomerLayout></ProtectedRoute>} />

                    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout><Overview /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/forecast" element={<ProtectedRoute role="admin"><AdminLayout><Forecast /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/schedules" element={<ProtectedRoute role="admin"><AdminLayout><Schedules /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/zones" element={<ProtectedRoute role="admin"><AdminLayout><ZoneMap /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/events" element={<ProtectedRoute role="admin"><AdminLayout><Events /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/customers" element={<ProtectedRoute role="admin"><AdminLayout><Customers /></AdminLayout></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
