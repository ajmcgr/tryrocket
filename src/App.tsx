import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Reserve from "./pages/Reserve.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Generate from "./pages/Generate.tsx";
import Editor from "./pages/Editor.tsx";
import { Navigate } from "react-router-dom";
import Assets from "./pages/Assets.tsx";
import AssetDetail from "./pages/AssetDetail.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import BrandKit from "./pages/BrandKit.tsx";
import ProjectWizard from "./pages/ProjectWizard.tsx";
import SharedAsset from "./pages/SharedAsset.tsx";
import SharedProject from "./pages/SharedProject.tsx";
import SettingsLayout, {
  ProfileSettings,
  IntegrationsSettings,
  NotificationsSettings,
  AccountSettings,
  BillingSettings,
} from "./pages/Settings.tsx";
import About from "./pages/About.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import MediaKit from "./pages/MediaKit.tsx";
import Tools from "./pages/Tools.tsx";
import ToolDetail from "./pages/ToolDetail.tsx";
import Pricing from "./pages/Pricing.tsx";
import FAQ from "./pages/FAQ.tsx";
import AppShell from "./components/AppShell.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/join" element={<Navigate to="/reserve" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/media-kit" element={<MediaKit />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/:slug" element={<ToolDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/share/asset/:token" element={<SharedAsset />} />
            <Route path="/share/project/:token" element={<SharedProject />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/projects" element={<Dashboard />} />
              <Route path="/projects/new" element={<ProjectWizard />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/projects/:id/brand-kit" element={<BrandKit />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/create" element={<Generate />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
              <Route path="/generate" element={<Navigate to="/create" replace />} />
              <Route path="/rocket/:id" element={<Navigate to="/assets" replace />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="integrations" element={<IntegrationsSettings />} />
                <Route path="notifications" element={<NotificationsSettings />} />
                <Route path="account" element={<AccountSettings />} />
                <Route path="billing" element={<BillingSettings />} />
              </Route>
              <Route path="/account" element={<Navigate to="/settings/profile" replace />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
