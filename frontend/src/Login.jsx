import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import bannerImg from "./2.png";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!API_URL) {
      alert("API URL not configured. Check Vercel environment variables.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/login`,
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Save user data
      localStorage.setItem("user", JSON.stringify(res.data));

      // Navigate based on role
      if (res.data.role === "manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/employee-dashboard");
      }

    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Invalid Email or Password"
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
            WELCOME BACK <br /> TO UBER EMS
          </h1>
          <p className="banner-hashtag">#workwell</p>
          <p className="banner-tagline">Setting the world in motion.</p>
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
          <h2>Login</h2>

          <form onSubmit={handleLogin} className="signup-form">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="login-link">
            New user? <Link to="/">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
