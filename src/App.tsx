import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import JobDetail from "@/pages/JobDetail";
import Candidates from "@/pages/Candidates";
import CandidateDetail from "@/pages/CandidateDetail";
import Companies from "@/pages/Companies";
import CompanyDetail from "@/pages/CompanyDetail";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetail />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/candidates/:id" element={<CandidateDetail />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                {/* Matching */}
                <Route path="/matches" element={<PlaceholderPage />} />
                <Route path="/match-resumes" element={<PlaceholderPage />} />
                <Route path="/reverse-match" element={<PlaceholderPage />} />
                {/* Workflows */}
                <Route path="/calendar" element={<PlaceholderPage />} />
                <Route path="/todos" element={<PlaceholderPage />} />
                <Route path="/emails" element={<ProtectedRoute minRole="hr_manager"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/verifications" element={<PlaceholderPage />} />
                <Route path="/hr-pipeline" element={<PlaceholderPage />} />
                {/* Advanced */}
                <Route path="/deal-closer" element={<PlaceholderPage />} />
                <Route path="/money-alerts" element={<ProtectedRoute minRole="hr_manager"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/insights" element={<PlaceholderPage />} />
                <Route path="/hired" element={<PlaceholderPage />} />
                {/* Admin */}
                <Route path="/master-db" element={<ProtectedRoute minRole="admin"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/productivity" element={<ProtectedRoute minRole="admin"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/activity-logs" element={<ProtectedRoute minRole="admin"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute minRole="admin"><PlaceholderPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute minRole="super_admin"><PlaceholderPage /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
