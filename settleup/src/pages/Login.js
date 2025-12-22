import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style/auth.css";

export default function Login({ setIsLoggedIn, setUser }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");

  // Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    if (!emailRegex.test(form.email)) return "Invalid email format";
    if (!form.password) return "Password is required";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );

      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));

      if (setIsLoggedIn) setIsLoggedIn(true);
      if (setUser) setUser(user);

      // Read pending invite AFTER login
      const pendingInvite = localStorage.getItem("pendingInvite");

      if (pendingInvite) {
        console.log("🔥 Found pendingInvite:", pendingInvite);

        // Remove it so it does not repeat
        localStorage.removeItem("pendingInvite");

        // Auto join group
        await axios.post("http://localhost:5000/api/groups/join-by-code", {
          inviteCode: pendingInvite,
          userId: user._id
        });

        console.log("🔥 Auto-joined group. Redirecting...");
        navigate("/groups");
        return;
      }

      navigate("/dashboard");

    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            className="auth-input"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            className="auth-input"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />

          <button className="auth-button" type="submit">Login</button>
        </form>

        <p className="switch-link">
          New to SettleUp?
          <button onClick={() => navigate("/register")}>Create an account</button>
        </p>
      </div>
    </div>
  );
}
