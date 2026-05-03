import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LandingPage from "@/pages/LandingPage";
import DashboardPage from "@/pages/DashboardPage";
import PricingPage from "@/pages/PricingPage";
import SettingsPage from "@/pages/SettingsPage";
import EducationPage from "@/pages/EducationPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import OptionsPage from "@/pages/OptionsPage";
import PerformancePage from "@/pages/PerformancePage";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { PaymentSuccessPage, PaymentCancelPage } from "@/pages/PaymentPages";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
