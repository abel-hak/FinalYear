import { useState, useEffect } from "react";
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

const App = () => {
  const [token, setToken] = useState<string | null>(getToken());

  useEffect(() => {
    const handleAuthChange = () => setToken(getToken());
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  return (
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
            element={token ? <Quests /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/quest/:id"
            element={token ? <QuestPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/achievements"
            element={token ? <Achievements /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/leaderboard"
            element={token ? <Leaderboard /> : <Navigate to="/login" replace />}
          />
          <Route path="/learning-paths" element={<LearningPaths />} />
          <Route
            path="/learning-paths/:id"
            element={token ? <LearningPathDetail /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/admin"
            element={token ? <AdminDashboard /> : <Navigate to="/login" replace />}
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
};

export default App;
