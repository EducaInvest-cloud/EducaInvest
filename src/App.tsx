import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Aprender from "./pages/Aprender";
import Simular from "./pages/Simular";
import Arcade from "./pages/Praticar";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Ranking from "./pages/Ranking";
import { AuthGuard } from "./components/auth/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/aprender" element={<Aprender />} />
          <Route path="/" element={<Home />} />
          <Route path="/simular" element={<Simular />} />
          <Route path="/praticar" element={<Arcade />} />
          <Route path="/perfil" element={
            <AuthGuard>
              <Perfil />
            </AuthGuard>
          } />
          <Route path="/ranking" element={<Ranking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
