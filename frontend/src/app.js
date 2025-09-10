import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home.jsx";
import Login from "./pages/login.jsx";
import Signup from "./pages/signup.jsx";
import InvestorSignUp from "./pages/investor_signup.jsx";
import UserDashboard from "./pages/userdashboard.jsx";
import Resources from "./pages/resources.jsx";
import Competitors from "./pages/competitors.jsx";
import Investors from "./pages/investors.jsx";
import MyStartup from "./pages/mystartup.jsx";
import ChatPage from "./pages/chatbot.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/investor_signup" element={<InvestorSignUp />} />
      <Route path="/userdashboard" element={<UserDashboard />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/competitors" element={<Competitors />} />
      <Route path="/investors" element={<Investors />} />
      <Route path="/mystartup" element={<MyStartup />} />
      <Route path="/chatbot" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


/*
import ChatPage from "./pages/chatbot";

function App() {
  return <ChatPage />;
}

export default App;



import Mystartup from "./pages/mystartup";  // Import Mystartup page

function App() {
  return <Mystartup />;  // Render the Mystartup page
}

export default App;


import InvestorSignUpPage from "./pages/investor_signup";  // Import Mystartup page

function App() {
  return <InvestorSignUpPage />;  // Render the InvestorSignUp page
}

export default App;



import AdminDashboard from "./pages/admin";  // Import Mystartup page

function App() {
  return <AdminDashboard />;
}

export default App;
*/
     


