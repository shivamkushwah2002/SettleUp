import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Navbar from "./navbar/Navbar.js";
import ToastContainer from './components/ToastContainer';
import LandingPage from "./landing_page/LandingPage.js";
import Login from "./pages/Login.js";
import Register from "./pages/Register.js";
import Dashboard from "./pages/Dashboard.js";
import GroupsPage from "./pages/groups/GroupsPage.js";
import CreateGroup from "./pages/groups/CreateGroup.js";
import GroupDetails from "./pages/groups/GroupDetails.js";
import JoinGroup from "./pages/groups/JoinGroup.js";



function AddExpense() { return <h2 style={{ padding: "2rem" }}>Add Expense</h2>; }
function Activity() { return <h2 style={{ padding: "2rem" }}>Activity</h2>; }
function About() { return <h2 style={{ padding: "2rem" }}>About</h2>; }

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

/* 🔥 Wrapper controls navbar visibility + routes */
function PageWrapper({ isLoggedIn, setIsLoggedIn, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
    // redirect to landing page after logout
    navigate('/');
  };

  // Hide Navbar on Login + Register pages
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar isLoggedIn={isLoggedIn} logoutHandler={logoutHandler} user={user} setUser={setUser} />}
      <ToastContainer />

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
          element={isLoggedIn ? <CreateGroup /> : <Navigate to="/" />}
        />

        <Route
          path="/groups/:groupId"
          element={isLoggedIn ? <GroupDetails /> : <Navigate to="/" />}
        />

        <Route
          path="/join/:inviteCode"
          element={isLoggedIn ? <JoinGroup /> : <Navigate to="/" />}
        />
      </Routes>
    </>
  );
}

export default App;
