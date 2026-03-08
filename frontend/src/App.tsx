import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Quests from "./pages/Quests";
import QuestPage from "./pages/QuestPage";
import Achievements from "./pages/Achievements";
import FAQ from "./pages/FAQ";
import AdminDashboard from "./pages/AdminDashboard";
import Leaderboard from "./pages/Leaderboard";
import LearningPaths from "./pages/LearningPaths";
import LearningPathDetail from "./pages/LearningPathDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getToken } from "./api/backend";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/quests"
            element={getToken() ? <Quests /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/quest/:id"
            element={getToken() ? <QuestPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/achievements"
            element={getToken() ? <Achievements /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/leaderboard"
            element={getToken() ? <Leaderboard /> : <Navigate to="/login" replace />}
          />
          <Route path="/learning-paths" element={<LearningPaths />} />
          <Route
            path="/learning-paths/:id"
            element={getToken() ? <LearningPathDetail /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={getToken() ? <AdminDashboard /> : <Navigate to="/login" replace />}
          />
          <Route path="/faq" element={<FAQ />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
