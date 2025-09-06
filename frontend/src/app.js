import React from "react";
/*
import Home from "./pages/home.jsx";

function App() {
  return <Home />;
}

export default App;


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



import ResourcesServicesPage from "./pages/resources";

function App() {
  return <ResourcesServicesPage />;
}

export default App;
*/


import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResourcesServicesPage from "./pages/resources";
import Home from "./pages/home.jsx";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/resources" element={<ResourcesServicesPage />} />
        {/* Add other routes here */}
      </Routes>
    </BrowserRouter>
  )
}

    
     


