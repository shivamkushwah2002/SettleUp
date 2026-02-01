import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style/auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contact: ""

  });

  const [error, setError] = useState("");

  // REGEX
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactRegex = /^[6-9]\d{9}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
    ;

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!emailRegex.test(form.email)) return "Invalid email format";
    if (!passwordRegex.test(form.password))
      return "Password must include uppercase, lowercase, number (min 6 chars)";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match";
    if (!contactRegex.test(form.contact))
      return "Enter a valid 10-digit Indian mobile number";

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
      const res = await axios.post(`${process.env.REACT_APP_FRONTEND_URL}/api/auth/register`, form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    }
  };

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>

          <input name="name" className="auth-input" placeholder="Full Name" onChange={handleChange} />

          <input name="email" className="auth-input" placeholder="Email Address" onChange={handleChange} />

          <input name="password" type="password" className="auth-input" placeholder="Password" onChange={handleChange} />

          <input name="confirmPassword" type="password" className="auth-input" placeholder="Confirm Password" onChange={handleChange} />

          <input name="contact" className="auth-input" placeholder="Contact Number" onChange={handleChange} />



          <button className="auth-button" type="submit">Register</button>
        </form>

        <p className="switch-link">
          Already have an account?
          <button onClick={() => navigate("/login")}>Login</button>
        </p>
      </div>
    </div>
  );
}
