import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUsers, FiUser } from "react-icons/fi";
import "./navbar.css";

function Sidebar({ logoutHandler, user, setUser, isOpen = true, onClose = () => {} }) {
  const openProfile = () => { onClose(); };

  const activeClass = ({ isActive }) => (isActive ? "sidebar-item active" : "sidebar-item");

  return (
    <>
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} aria-label="Main sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-top">
          <div className="sidebar-logo">SettleUp</div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={activeClass} aria-current="page">
            <span className="sidebar-icon"><FiHome /></span>
            <span className="sidebar-text">Dashboard</span>
          </NavLink>

          <NavLink to="/groups" className={activeClass}>
            <span className="sidebar-icon"><FiUsers /></span>
            <span className="sidebar-text">Groups</span>
          </NavLink>

          <NavLink to="/profile" className={activeClass} onClick={() => onClose()}>
            <span className="sidebar-icon"><FiUser /></span>
            <span className="sidebar-text">Profile</span>
          </NavLink>

          {/* Logout moved into Profile modal for better UX */}
        </nav>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;
