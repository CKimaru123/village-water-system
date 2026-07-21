import React, { useState, useEffect } from "react";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBTypography,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ text: "Invalid reset link. Please request a new one.", type: "error" });
    }
  }, [token]);

  const handleReset = async () => {
    if (!password || !passwordConfirmation) {
      setMessage({ text: "Please fill in both password fields.", type: "error" });
      return;
    }
    if (password !== passwordConfirmation) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, password_confirmation: passwordConfirmation }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: "Password reset successfully! Redirecting to login...", type: "success" });
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage({ text: result.message || "Failed to reset password.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Could not connect to server. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDBContainer
      fluid
      style={{
        backgroundImage: "url('/img/waterbg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: "100px 20px 20px 20px",
        height: "100vh",
        margin: "0",
        boxSizing: "border-box",
      }}
    >
      <MDBRow className="g-0" style={{ height: "100%", margin: "0" }}>
        <MDBCol
          md="6"
          style={{ position: "relative", height: "100%", margin: "0", padding: "0" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "200px",
              right: 0,
              bottom: 0,
              backgroundImage:
                "url('https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/img1.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              border: "2px solid #fff",
              borderTopLeftRadius: "20px",
              borderBottomLeftRadius: "20px",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          />
        </MDBCol>

        <MDBCol
          md="6"
          style={{ position: "relative", height: "100%", margin: "0", padding: "0" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: "200px",
              bottom: 0,
              backgroundColor: "#fff",
              borderTopRightRadius: "20px",
              borderBottomRightRadius: "20px",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div style={{ width: "300px", textAlign: "center", marginTop: "100px" }}>
              <div style={{ marginBottom: "20px" }}>
                <img src="/img/logo.jpg" alt="Logo" style={{ width: "80px" }} />
              </div>

              <MDBTypography tag="h5" className="mb-2">
                Set new password
              </MDBTypography>

              <p className="text-muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
                Must be at least 8 characters with uppercase, lowercase, number, and special character.
              </p>

              {message && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
                    color: message.type === "success" ? "#155724" : "#721c24",
                    border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                    textAlign: "left",
                  }}
                >
                  {message.text}
                </div>
              )}

              <MDBInput
                placeholder="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-3"
                style={{ width: "100%" }}
                disabled={!token}
              />

              <MDBInput
                placeholder="Confirm new password"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="mb-4"
                style={{ width: "100%" }}
                disabled={!token}
              />

              <MDBBtn
                className="w-100 mb-3"
                style={{ backgroundColor: "#393f81", borderColor: "#393f81" }}
                onClick={handleReset}
                disabled={loading || !token}
              >
                {loading ? "Resetting..." : "RESET PASSWORD"}
              </MDBBtn>

              <p className="text-center">
                <a href="/login" style={{ textDecoration: "none", color: "#0d6efd", fontWeight: "500" }}>
                  Back to login
                </a>
              </p>
            </div>
          </div>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default ResetPassword;
