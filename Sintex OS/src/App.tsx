import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import Login from "./pages/Login";
import TorreDeControle from "./pages/TorreDeControle";
import PatioLogistica from "./pages/PatioLogistica";
import DigitalTwin from "./pages/DigitalTwin";
import SmartProcurement from "./pages/SmartProcurement";
import Backoffice from "./pages/Backoffice";
import Formulations from "./pages/Formulations";
import TaxModule from "./pages/TaxModule";
import BlockchainESG from "./pages/BlockchainESG";
import SuperAdmin from "./pages/SuperAdmin";
import TeamManagement from "./pages/TeamManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<TorreDeControle />} />
        <Route path="/patio" element={<PatioLogistica />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/procurement" element={<SmartProcurement />} />
        <Route path="/backoffice" element={<Backoffice />} />
        <Route path="/formulations" element={<Formulations />} />
        <Route path="/tax" element={<TaxModule />} />
        <Route path="/blockchain" element={<BlockchainESG />} />
        <Route path="/super-admin" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdmin /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><TeamManagement /></ProtectedRoute>} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
