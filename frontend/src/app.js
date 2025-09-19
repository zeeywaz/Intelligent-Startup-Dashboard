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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/investor_signup" element={<InvestorSignUp />} />
      <Route path="/userdashboard" element={<UserDashboard />} />

      {/* Categories grid */}
      <Route path="/resources" element={<ResourcesPage />} />
      {/* Directory list (receives ?type=...) */}
      <Route path="/resources/directory" element={<ResourcesDirectory />} />

      <Route path="/competitors" element={<Competitors />} />
      <Route path="/investors" element={<Investors />} />
      <Route path="/mystartup" element={<MyStartup />} />
      <Route path="/chatbot" element={<ChatPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/investordashboard" element={<InvestorDashboard />} />
      <Route path="/admin_user" element={<AdminUser />} />
      <Route path="/admindashboard" element={<AdminDashboard />} />

      {/* NEW routes */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
