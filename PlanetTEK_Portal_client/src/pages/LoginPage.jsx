import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/img/Logo.png";

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const success = await login(username, password);
      if (!success) {
        setError("Incorrect username or password!");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    }

    
  };

  return (
    <div 
      className="d-flex flex-column align-items-center justify-content-center vh-100"
      style={{
        // Logodaki koyu gri ve canlı yeşilden beslenen modern, enerjik degrade arka plan
        background: "linear-gradient(135deg, #1A1A1A 0%, #0E8345 100%)",
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Login Kartı */}
      <div
        className="card border-0 p-4 p-sm-5 bg-white text-dark"
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.3)",
          borderTop: "6px solid #0E8345" // Kurumsal Yeşil Çizgi
        }}
      >
        {/* Logo Kartın İçinde (Böylece arkası şeffaf olmasa bile kusursuz görünüyor) */}
        <div className="text-center">
          <img
            src={Logo}
            alt="Plaretteb Logo"
            className="img-fluid"
            style={{height: "auto", objectFit: "contain" }}
          />
        </div>

        <h4 className="text-center mb-4 fw-bold text-secondary" style={{ letterSpacing: "0.5px" }}>
          Giriş Yap
        </h4>

        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 mb-4 rounded-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Kullanıcı Adı */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted mb-1">
              Username
            </label>
            <input
              type="text"
              className="form-control px-3 py-2.5 shadow-none border-secondary-subtle"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                borderRadius: "8px",
                fontSize: "0.95rem"
              }}
              required
            />
          </div>

          {/* Şifre */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted mb-1">
              Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control px-3 py-2.5 shadow-none border-secondary-subtle"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  borderRadius: "8px 0 0 8px",
                  borderRight: "none",
                  fontSize: "0.95rem"
                }}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary bg-white border-secondary-subtle px-3 shadow-none text-secondary"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  borderRadius: "0 8px 8px 0",
                  borderLeft: "none"
                }}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          {/* Giriş Butonu (Kurumsal Yeşil) */}
          <button
            type="submit"
            className="btn w-100 fw-semibold py-2.5 text-white shadow-none"
            style={{
              backgroundColor: "#0E8345",
              borderRadius: "8px",
              fontSize: "1rem",
              transition: "background-color 0.2s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0A6334"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0E8345"}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;