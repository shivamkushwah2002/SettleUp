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
        `${process.env.REACT_APP_FRONTEND_URL}/api/auth/login`,
        form
      );

      // Login Success
      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));

      if (setIsLoggedIn) setIsLoggedIn(true);
      if (setUser) setUser(user);

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
