// App.js
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import InvestorSignUp from "./pages/investor_signup.jsx";
import UserDashboard from "./pages/userdashboard.jsx";
import ResourcesPage from "./pages/resources.jsx";
import ResourcesDirectory from "./pages/ResourcesDirectory.jsx";
import Competitors from "./pages/competitors.jsx";
import Investors from "./pages/investors.jsx";
import MyStartup from "./pages/mystartup.jsx";
import ChatPage from "./pages/chatbot.jsx";
import ProfilePage from "./pages/profile.jsx";
import InvestorDashboard from "./pages/investordashboard.jsx";
import AdminUser from "./pages/admin_user.jsx";
import AdminDashboard from "./pages/admindashboard.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import InvestorInterest from "./pages/InvestorInterest.jsx";

import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireAuth, RequireRole, PublicOnly } from "./auth/RouteGuards.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes (available to everyone) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Only show when NOT logged in */}
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/investor_signup" element={<InvestorSignUp />} />
        </Route>

        {/* General protected pages (must be logged in) */}
        <Route element={<RequireAuth />}>
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/directory" element={<ResourcesDirectory />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/mystartup" element={<MyStartup />} />
          <Route path="/chatbot" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/interests" element={<InvestorInterest />} />
        </Route>

        {/* Role-locked dashboards */}
        <Route element={<RequireRole role="user" />}>
          <Route path="/userdashboard" element={<UserDashboard />} />
        </Route>

        <Route element={<RequireRole role="investor" />}>
          <Route path="/investordashboard" element={<InvestorDashboard />} />
        </Route>

        <Route element={<RequireRole role="admin" />}>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/admin_user" element={<AdminUser />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
