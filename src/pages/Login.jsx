import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const ADMIN_PASSWORD = "12345";

const Login = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin");
    } else {
      setError("Wrong password");
    }
  };

  return (
    <main className="py-5">
      <div className="container d-flex justify-content-center">
        <div className="card shadow-sm" style={{ maxWidth: "400px", width: "100%" }}>
          <div className="card-body">
            <h4 className="mb-3 text-center">Admin Login</h4>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-danger small">{error}</p>}

              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </form>

            <p className="text-muted mt-3 small text-center">
              Demo Password: <code>{ADMIN_PASSWORD}</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
