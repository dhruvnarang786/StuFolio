import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import AIAnalysis from "./pages/AIAnalysis";
import CalendarPage from "./pages/CalendarPage";
import AttendancePage from "./pages/AttendancePage";
import AcademicsPage from "./pages/AcademicsPage";
import CareerPage from "./pages/CareerPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MentorDashboard from "./pages/MentorDashboard";
import MentorStudentsPage from "./pages/MentorStudentsPage";
import MentorStudentDetail from "./pages/MentorStudentDetail";
import MentorAnalytics from "./pages/MentorAnalytics";
import MentorAttendancePage from "./pages/MentorAttendancePage";
import HodAcademicView from "./pages/HodAcademicView";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RootRoute = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    const isFaculty = user?.role === "MENTOR" || user?.role === "FACULTY";
    return <Navigate to={isFaculty ? "/mentor" : "/dashboard"} replace />;
  }

  return <LandingPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="stufolio-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Student */}
              <Route path="/dashboard" element={<ProtectedRoute requiredRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute requiredRole="STUDENT"><StudentProfile /></ProtectedRoute>} />
              <Route path="/ai-analysis" element={<ProtectedRoute requiredRole="STUDENT"><AIAnalysis /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute requiredRole="STUDENT"><AttendancePage /></ProtectedRoute>} />
              <Route path="/academics" element={<ProtectedRoute requiredRole="STUDENT"><AcademicsPage /></ProtectedRoute>} />
              <Route path="/career" element={<ProtectedRoute requiredRole="STUDENT"><CareerPage /></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Faculty */}
              <Route path="/mentor" element={<ProtectedRoute requiredRole="FACULTY"><MentorDashboard /></ProtectedRoute>} />
              <Route path="/mentor/students" element={<ProtectedRoute requiredRole="FACULTY"><MentorStudentsPage /></ProtectedRoute>} />
              <Route path="/mentor/student-detail" element={<ProtectedRoute requiredRole="FACULTY"><MentorStudentDetail /></ProtectedRoute>} />
              <Route path="/mentor/attendance" element={<ProtectedRoute requiredRole="FACULTY"><MentorAttendancePage /></ProtectedRoute>} />
              <Route path="/mentor/academics" element={<ProtectedRoute requiredRole="FACULTY"><HodAcademicView /></ProtectedRoute>} />
              <Route path="/mentor/analytics" element={<ProtectedRoute requiredRole="FACULTY"><MentorAnalytics /></ProtectedRoute>} />
              <Route path="/mentor/settings" element={<ProtectedRoute requiredRole="FACULTY"><SettingsPage /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
