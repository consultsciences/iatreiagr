import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import IndexEn from "./pages/IndexEn.tsx";
import Pricing from "./pages/Pricing.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import ClinicLaunch from "./pages/ClinicLaunch.tsx";
import { SpacesPage, EquipmentPage, JobsPage, SuppliesPage, ServicesPage } from "./pages/listings";
import ListingDetail from "./pages/listings/ListingDetail.tsx";
import AuthPage from "./pages/Auth.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import Bookings from "./pages/Bookings.tsx";
import DoctorAuth from "./pages/DoctorAuth.tsx";
import DoctorDashboard from "./pages/DoctorDashboard.tsx";
import DoctorOnboarding from "./pages/DoctorOnboarding.tsx";
import DoctorProfile from "./pages/DoctorProfile.tsx";
import Search from "./pages/Search.tsx";
import Articles from "./pages/Articles.tsx";
import ArticleDetail from "./pages/ArticleDetail.tsx";
import Ask from "./pages/Ask.tsx";
import Clinics from "./pages/Clinics.tsx";
import ClinicsAdmin from "./pages/ClinicsAdmin.tsx";
import MedicalTourism from "./pages/MedicalTourism.tsx";
import Post from "./pages/Post.tsx";
import MyListings from "./pages/MyListings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: `${window.location.origin}${basePath}/`,
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "#9b5e4d",
    colorTextOnPrimaryBackground: "#ffffff",
    borderRadius: "0.5rem",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Καλώς ήρθατε στο iatreia.gr",
      subtitle: "Συνδεθείτε στον λογαριασμό σας",
    },
  },
  signUp: {
    start: {
      title: "Δημιουργία λογαριασμού",
      subtitle: "Εγγραφείτε στο iatreia.gr",
    },
  },
};

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance} localization={clerkLocalization}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/en" element={<IndexEn />} />
              <Route path="/search" element={<Search />} />
              <Route path="/spaces" element={<SpacesPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/supplies" element={<SuppliesPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/listing/:slug" element={<ListingDetail />} />
              <Route path="/clinic-launch" element={<ClinicLaunch />} />
              <Route path="/clinics" element={<Clinics />} />
              <Route path="/clinics/admin" element={<ClinicsAdmin />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="/medical-tourism" element={<MedicalTourism />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/post" element={<Post />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/doctors/auth" element={<DoctorAuth />} />
              <Route path="/doctors/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctors/onboarding" element={<DoctorOnboarding />} />
              <Route path="/doctors/:userId" element={<DoctorProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
