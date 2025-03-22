
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import { PostsProvider } from "./contexts/PostsContext";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PostsProvider>
        <Toaster />
        <Sonner position="top-right" closeButton />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Index /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/calendar" element={<AppLayout><Calendar /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PostsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
