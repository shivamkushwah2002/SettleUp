import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "./navbar/Navbar.js";
import Sidebar from "./navbar/Sidebar";
import ToastContainer from './components/ToastContainer';
import LandingPage from "./landing_page/LandingPage.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Dashboard from "./pages/Dashboard.js";
import GroupsPage from "./pages/groups/GroupsPage.js";
import CreateGroup from "./pages/groups/CreateGroup.js";
import GroupDetails from "./pages/groups/GroupDetails.js";
import JoinGroup from "./pages/groups/JoinGroup.js";
import Profile from "./pages/Profile";


// Main App Component
// Manages global authentication state (`user`, `isLoggedIn`) loaded from localStorage.
function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("user"));

  return (
    <Router>
      <PageWrapper
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        user={user}
        setUser={setUser}
      />
    </Router>
  );
}

/**
 * Wrapper for routing logic.
 * Handles:
 * 1. Navbar visibility (hidden on auth pages).
 * 2. Protected Routes (redirect to / if not logged in).
 * 3. Sidebar toggle for mobile view.
 */
function PageWrapper({ isLoggedIn, setIsLoggedIn, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const logoutHandler = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    // redirect to landing page after logout
    navigate('/');
  };

  // Hide top Navbar on Login + Register pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  const routes = (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" /> : <LandingPage />}
      />

      <Route
        path="/login"
        element={<Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected routes: redirect to landing page when not logged in */}
      <Route
        path="/dashboard"
        element={isLoggedIn ? <Dashboard user={user} /> : <Navigate to="/" />}
      />

      <Route
        path="/groups"
        element={isLoggedIn ? <GroupsPage /> : <Navigate to="/" />}
      />

      <Route
        path="/groups/create"
        element={isLoggedIn ? <CreateGroup user={user} /> : <Navigate to="/" />}
      />

      <Route
        path="/groups/:groupId"
        element={isLoggedIn ? <GroupDetails /> : <Navigate to="/" />}
      />

      <Route
        path="/profile"
        element={isLoggedIn ? <Profile user={user} setUser={setUser} logoutHandler={() => { localStorage.removeItem('user'); setUser(null); setIsLoggedIn(false); navigate('/'); }} /> : <Navigate to="/" />}
      />

      <Route
        path="/join/:inviteCode"
        element={isLoggedIn ? <JoinGroup /> : <Navigate to="/" />}
      />
    </Routes>
  );

  return (
    <>
      {/* Show top Navbar only when NOT logged in and not on auth pages */}
      {!isLoggedIn && !hideNavbar && <Navbar isLoggedIn={isLoggedIn} logoutHandler={logoutHandler} user={user} setUser={setUser} />}
      <ToastContainer />

      {isLoggedIn ? (
        <div className="app-with-sidebar">
          {/* Sidebar gets controlled open/close for mobile */}
          <Sidebar logoutHandler={logoutHandler} user={user} setUser={setUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* mobile open button - visible only on small screens via CSS */}
          <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">Menu</button>

          {/* overlay shown when sidebar open on small screens */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <main className="main-content">
            {routes}
          </main>
        </div>
      ) : (
        routes
      )}
    </>
  );
}

export default App;
