import React, { useState, useEffect } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import { Navigation } from "./pages/Navigation";
import { Header } from "./pages/Header";
import { Features } from "./pages/Features";
import { About } from "./pages/About";
import { Services } from "./pages/Services";
import { EnhancedGallery } from "./pages/EnhancedGallery";
import EnhancedBlogs from "./pages/EnhancedBlogs";
import EnhancedSingleBlog from "./pages/EnhancedSingleBlog";
import { Testimonials } from "./pages/Testimonials";
import { Team } from "./pages/Team";
import { Contact } from "./pages/Contact";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import LoginImproved from "./pages/LoginImproved";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MarketPlace from "./pages/MarketPlace"

// Import dashboard components
import AdminDashboardWrapper from "./apps/admin/AdminDashboardWrapper";
import ClientDashboardWrapper from "./apps/client/ClientDashboardWrapper";

// Import authentication
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

// Import JSON data
import jsonData from "./data/data.json";

// Favicon utility function
const updateFavicon = () => {
  // Ensure favicon is always available on all routes
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!favicon) {
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = '/favicon.ico';
    document.head.appendChild(newFavicon);
  }
  
  // Also ensure shortcut icon
  const shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
  if (!shortcutIcon) {
    const newShortcutIcon = document.createElement('link');
    newShortcutIcon.rel = 'shortcut icon';
    newShortcutIcon.href = '/favicon.ico';
    newShortcutIcon.type = 'image/x-icon';
    document.head.appendChild(newShortcutIcon);
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setData(jsonData); // Load JSON into state
    
    // Ensure favicon is available on app load
    updateFavicon();
  }, []);

  return <AppContent data={data} />;
};

// Main app content
const AppContent: React.FC<{ data: any }> = ({ data }) => {
  const { logout } = useAuth();

  useEffect(() => {
    // Ensure favicon is updated on route changes
    updateFavicon();
    
    // Listen for dashboard events from the client/admin topbar
    const handleCloseDashboard = () => {
      // Navigate back to main site
      window.location.href = '/';
    };

    const handleLogoutDashboard = async () => {
      // Logout and navigate to home
      await logout();
      // Small delay to ensure logout completes
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    };

    // Add event listeners
    window.addEventListener('closeDashboard', handleCloseDashboard);
    window.addEventListener('logoutDashboard', handleLogoutDashboard);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('closeDashboard', handleCloseDashboard);
      window.removeEventListener('logoutDashboard', handleLogoutDashboard);
    };
  }, [logout]);

  return (
    <>
      <Router>
        <Routes>
          {/* Protected Dashboard Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardWrapper />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client/*" 
            element={
              <ProtectedRoute requiredRole="client">
                <ClientDashboardWrapper />
              </ProtectedRoute>
            } 
          />

          {/* Public Routes with Navigation */}
          <Route path="/*" element={
            <div>
              <Navigation />
              <Routes>
                {/* Homepage */}
                <Route
                  path="/"
                  element={
                    <>
                      <div id="home">
                        <Header data={data?.Header} />
                      </div>
                      <div id="about">
                        <About data={data?.About} />
                      </div>
                      <div id="features">
                        <Features data={data?.Features} />
                      </div>
                      <div id="services">
                        <Services data={data?.Services} />
                      </div>
                      <div id="portfolio">
                        <EnhancedGallery data={data?.Gallery} />
                      </div>
                      <div id="testimonials">
                        <Testimonials data={data?.Testimonials} />
                      </div>
                      <div id="team">
                        <Team data={data?.Team} />
                      </div>
                      <div id="contact">
                        <Contact data={data?.Contact} />
                      </div>
                    </>
                  }
                />

                {/* Auth pages */}
                <Route path="/register" element={<Signup />} />
                <Route path="/login" element={<Login />} />
                
                {/* Legacy auth pages */}
                <Route path="/login-improved" element={<LoginImproved />} />
                <Route path="/forgotpassword" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Other public pages */}
                <Route path="/blogs" element={<EnhancedBlogs />} />
                <Route path="/blogs/:id" element={<EnhancedSingleBlog />} />
                <Route path="/marketplace" element={<MarketPlace />} />
              </Routes>
            </div>
          } />
        </Routes>
      </Router>
    </>
  );
};

export default App;
