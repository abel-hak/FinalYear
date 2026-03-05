import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Quests from "./pages/Quests";
import QuestPage from "./pages/QuestPage";
import Achievements from "./pages/Achievements";
import Prototype from "./pages/Prototype";
import FAQ from "./pages/FAQ";
import AdminDashboard from "./pages/AdminDashboard";
import StyleGuide from "./pages/StyleGuide";
import AccessControlSecurity from "./pages/AccessControlSecurity";
import PresentationPractice from "./pages/PresentationPractice";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getToken } from "./api/backend";

const queryClient = new QueryClient();

const App = () => (
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
            path="/admin"
            element={getToken() ? <AdminDashboard /> : <Navigate to="/login" replace />}
          />
          <Route path="/prototype" element={<Prototype />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/style-guide" element={<StyleGuide />} />
          <Route path="/access-control-security" element={<AccessControlSecurity />} />
          <Route path="/presentation-practice" element={<PresentationPractice />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
