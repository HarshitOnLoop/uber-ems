import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./signup.css";
import bannerImg from "./2.png";

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_URL) {
      alert("API URL not configured. Check your .env file.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/signup`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message || "User Created Successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Server error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Left Section */}
      <div className="signup-banner">
        <div className="banner-text-wrapper">
          <h1 className="banner-title">
            WELCOME TO <br /> UBER EMS
          </h1>
          <p className="banner-hashtag">#moveforward</p>
          <p className="banner-brand">Uber</p>
        </div>
        <div className="banner-image-container">
          <img
            src={bannerImg}
            alt="Uber Graphic"
            className="banner-image"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="signup-form-section">
        <div className="form-wrapper">
          <h2>Create Account</h2>

          <form onSubmit={handleSubmit} className="signup-form">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Get Started"}
            </button>
          </form>

          <p className="login-link">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
