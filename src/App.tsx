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
import Matches from "@/pages/Matches";
import DealCloser from "@/pages/DealCloser";
import MoneyAlerts from "@/pages/MoneyAlerts";
import Insights from "@/pages/Insights";
import HiredCandidates from "@/pages/HiredCandidates";
import MasterDB from "@/pages/MasterDB";
import PlaceholderPage from "@/pages/PlaceholderPage";
import MatchResumes from "@/pages/MatchResumes";
import ReverseMatch from "@/pages/ReverseMatch";
import HRPipeline from "@/pages/HRPipeline";
import Todos from "@/pages/Todos";
import Calendar from "@/pages/Calendar";
import Verifications from "@/pages/Verifications";
import Emails from "@/pages/Emails";
import NotFound from "./pages/NotFound";

// Phase 2: Public pages
import PortalHome from "@/pages/portal/PortalHome";
import SubmitCV from "@/pages/portal/SubmitCV";
import CandidateOnboarding from "@/pages/portal/CandidateOnboarding";
import HRReview from "@/pages/portal/HRReview";
import HRSwipeReview from "@/pages/portal/HRSwipeReview";
import InterviewSchedule from "@/pages/portal/InterviewSchedule";
import InterviewSelect from "@/pages/portal/InterviewSelect";
import HROptOut from "@/pages/portal/HROptOut";
import HRReopen from "@/pages/portal/HRReopen";

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
              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Phase 2: Public pages (no auth) */}
              <Route path="/portal" element={<PortalHome />} />
              <Route path="/submit-cv" element={<SubmitCV />} />
              <Route path="/onboarding/:candidateId" element={<CandidateOnboarding />} />
              <Route path="/hr-review" element={<HRReview />} />
              <Route path="/hr-swipe" element={<HRSwipeReview />} />
              <Route path="/interview-schedule" element={<InterviewSchedule />} />
              <Route path="/interview-select" element={<InterviewSelect />} />
              <Route path="/hr-opt-out" element={<HROptOut />} />
              <Route path="/hr-reopen" element={<HRReopen />} />

              {/* Protected admin routes */}
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
                <Route path="/matches" element={<Matches />} />
                <Route path="/match-resumes" element={<MatchResumes />} />
                <Route path="/reverse-match" element={<ReverseMatch />} />
                {/* Workflows */}
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/todos" element={<Todos />} />
                <Route path="/emails" element={<ProtectedRoute minRole="hr_manager"><Emails /></ProtectedRoute>} />
                <Route path="/verifications" element={<Verifications />} />
                <Route path="/hr-pipeline" element={<HRPipeline />} />
                {/* Advanced */}
                <Route path="/deal-closer" element={<DealCloser />} />
                <Route path="/money-alerts" element={<ProtectedRoute minRole="hr_manager"><MoneyAlerts /></ProtectedRoute>} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/hired" element={<HiredCandidates />} />
                {/* Admin */}
                <Route path="/master-db" element={<ProtectedRoute minRole="admin"><MasterDB /></ProtectedRoute>} />
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
