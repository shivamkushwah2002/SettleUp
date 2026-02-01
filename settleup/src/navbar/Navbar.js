import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./navbar.css";

function Navbar({ isLoggedIn, logoutHandler, user, setUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', contact: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Toggles mobile menu
    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    const openProfile = () => {
        if (!user) return;
        setProfileForm({ name: user.name || '', email: user.email || '', contact: user.contact || '' });
        setShowProfile(true);
        setIsOpen(false);
    };

    useEffect(() => {
        const handler = () => openProfile();
        window.addEventListener('app/openProfile', handler);
        return () => window.removeEventListener('app/openProfile', handler);
    }, [user]);

    const handleProfileSave = async () => {
        if (!user) return;
        setSavingProfile(true);
        try {
            const res = await axios.put(`${process.env.REACT_APP_FRONTEND_URL}/api/auth/${user._id}`, profileForm);
            const updated = res.data.user || res.data;
            // update localStorage and parent state if available
            localStorage.setItem('user', JSON.stringify(updated));
            setUser && setUser(updated);
            setShowProfile(false);
            window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Profile updated', type: 'success' } }));
        } catch (err) {
            console.error('Profile update failed', err);
            // If backend doesn't support profile update, fall back to updating local state/localStorage
            if (err.response && (err.response.status === 404 || err.response.status === 405)) {
                const updated = { ...user, ...profileForm };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser && setUser(updated);
                setShowProfile(false);
                window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Profile saved locally (backend update unavailable)', type: 'info' } }));
            } else {
                window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: err.response?.data?.message || 'Failed to update profile', type: 'error' } }));
            }
        } finally {
            setSavingProfile(false);
        }
    };

    return (<>
        <nav className="navbar">
            <div className="nav-container">
                {/* Logo */}
                <div className="nav-logo">
                    {isLoggedIn ? <Link to="/Dashboard">SettleUp</Link> : <Link to="/">SettleUp</Link>}
                </div>

                {/* Conditional Rendering */}
                <div className={`nav-links ${isOpen ? "open" : ""}`}>
                    {isLoggedIn ? (
                        <>
                            <Link to="/dashboard" className="nav-item" onClick={() => setIsOpen(false)}>Dashboard</Link>
                            <Link to="/groups" className="nav-item" onClick={() => setIsOpen(false)}>Groups</Link>
                            <a className="nav-item" onClick={openProfile}>Profile</a>
                            <a className="nav-item" onClick={() => setShowLogoutConfirm(true)}>Logout</a>

                        </>
                    ) : (
                        <>

                            <a className="nav-item" onClick={() => scrollToSection("hero")}>Home</a>
                            <a className="nav-item" onClick={() => scrollToSection("features")}>Features</a>
                            <a className="nav-item" onClick={() => scrollToSection("how")}>How it Works</a>
                            <a className="nav-item" onClick={() => scrollToSection("about")}>About</a>

                            <Link to="/login" className="nav-item" onClick={() => setIsOpen(false)}>
                                Get Started
                            </Link>

                        </>
                    )}
                </div>

                {/* Hamburger Icon */}
                <div className="hamburger" onClick={toggleMenu}>
                    <div className={`bar ${isOpen ? "rotate1" : ""}`}></div>
                    <div className={`bar ${isOpen ? "fade" : ""}`}></div>
                    <div className={`bar ${isOpen ? "rotate2" : ""}`}></div>
                </div>

            </div>
        </nav>

        {/* Logout confirmation modal */}
        {showLogoutConfirm && (
            <div className="modal">
                <div className="modal-card">
                    <div className="modal-header">
                        <h3 style={{ margin: 0 }}>Confirm Logout</h3>
                        <button onClick={() => setShowLogoutConfirm(false)} className="modal-close">×</button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to logout?</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn btn-danger" onClick={() => { setShowLogoutConfirm(false); logoutHandler && logoutHandler(); }}>Logout</button>
                            <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Profile modal */}
        {showProfile && (
            <div className="modal">
                <div className="modal-card">
                    <div className="modal-header">
                        <h3 style={{ margin: 0 }}>Your Profile</h3>
                        <button onClick={() => setShowProfile(false)} className="modal-close">×</button>
                    </div>
                    <div className="modal-body">
                        <label>Name</label>
                        <input className="input" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />

                        <label>Email</label>
                        <input className="input" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />

                        <label>Contact</label>
                        <input className="input" value={profileForm.contact} onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value })} />

                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={handleProfileSave} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save'}</button>
                            <button className="btn btn-ghost" onClick={() => setShowProfile(false)}>Cancel</button>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-danger" onClick={() => { setShowProfile(false); setShowLogoutConfirm(true); }}>Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

    </>
    );
}

export default Navbar;
