import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
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
import VerifyEmail from "./pages/VerifyEmail.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Generate from "./pages/Generate.tsx";
import Editor from "./pages/Editor.tsx";
import Presenter from "./pages/Presenter.tsx";
import Assets from "./pages/Assets.tsx";
import Trash from "./pages/Trash.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import Studio from "./pages/Studio.tsx";
import Brand from "./pages/Brand.tsx";
import BrandHub from "./pages/BrandHub.tsx";
import BrandKit from "./pages/BrandKit.tsx";
import BrandKitHub from "./pages/BrandKitHub.tsx";
import ProjectWizard from "./pages/ProjectWizard.tsx";
import Templates from "./pages/Templates.tsx";
import Insights from "./pages/Insights.tsx";
import Notifications from "./pages/Notifications.tsx";
import SharedAsset from "./pages/SharedAsset.tsx";
import SharedProject from "./pages/SharedProject.tsx";
import Gallery from "./pages/Gallery.tsx";
import SettingsLayout, {
  ProfileSettings,
  IntegrationsSettings,
  NotificationsSettings,
  AccountSettings,
  BillingSettings,
} from "./pages/Settings.tsx";
import Team from "./pages/Team.tsx";
import AcceptInvite from "./pages/AcceptInvite.tsx";
import About from "./pages/About.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import Compare from "./pages/Compare.tsx";
import ComparisonDetail from "./pages/ComparisonDetail.tsx";
import MediaKit from "./pages/MediaKit.tsx";
import Tools from "./pages/Tools.tsx";
import ToolDetail from "./pages/ToolDetail.tsx";
import Pricing from "./pages/Pricing.tsx";
import FAQ from "./pages/FAQ.tsx";
import AppShell from "./components/AppShell.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { NotificationsProvider } from "./contexts/NotificationsContext.tsx";

const queryClient = new QueryClient();

const AssetRouteRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/editor?id=${id}` : "/assets"} replace />;
};

const StudioRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/brands/${id}` : "/brands"} replace />;
};

const BrandIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/brands/${id}` : "/brands"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationsProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/join" element={<Navigate to="/reserve" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/:slug" element={<ComparisonDetail />} />
            <Route path="/media-kit" element={<MediaKit />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/:slug" element={<ToolDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/share/asset/:token" element={<SharedAsset />} />
            <Route path="/share/project/:token" element={<SharedProject />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/projects" element={<Dashboard />} />
              <Route path="/projects/new" element={<ProjectWizard />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/studio" element={<Navigate to="/brands" replace />} />
              <Route path="/studio/:id" element={<StudioRedirect />} />
              <Route path="/brands" element={<BrandHub />} />
              <Route path="/brands/:id" element={<Brand />} />
              <Route path="/brand" element={<Navigate to="/brands" replace />} />
              <Route path="/brand/:id" element={<BrandIdRedirect />} />
              <Route path="/projects/:id/brand-kit" element={<BrandKit />} />
              <Route path="/projects/:id/hub" element={<BrandKitHub />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/:id" element={<AssetRouteRedirect />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/create" element={<Generate />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/present" element={<Presenter />} />
              <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
              <Route path="/generate" element={<Navigate to="/create" replace />} />
              <Route path="/rocket/:id" element={<AssetRouteRedirect />} />
              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<Navigate to="/settings/profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="team" element={<Team />} />
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
          </NotificationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
