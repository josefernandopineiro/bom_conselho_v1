
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StudentsProvider } from "@/context/StudentsContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import StudentsPage from "./pages/StudentsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudentsProvider>
        <Router>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Index />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
              
              <Route element={<ProtectedRoute requiresAdmin />}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </Router>
      </StudentsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
