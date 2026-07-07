import React, { useState } from "react";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBTypography,
  MDBInput,
  MDBBtn,
} from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleReset = async () => {
    if (!identifier.trim()) {
      setMessage({ text: "Please enter your email or phone number.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Determine if it's email or phone
      const isEmail = identifier.includes("@");
      const body = isEmail ? { email: identifier } : { phone: identifier };

      const response = await fetch("http://localhost:3001/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ text: result.message, type: "success" });
      } else {
        setMessage({ text: result.message || "Something went wrong.", type: "error" });
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
        {/* LEFT COLUMN */}
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

        {/* RIGHT COLUMN */}
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
                Reset your password
              </MDBTypography>

              <p className="text-muted" style={{ fontSize: "14px", marginBottom: "24px" }}>
                Enter your email or phone number and we'll send you a reset link.
              </p>

              {/* Feedback message */}
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
                placeholder="Email or phone number"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="mb-4"
                style={{ width: "100%" }}
              />

              <div style={{ marginBottom: "16px" }} />

              <MDBBtn
                className="w-100 mb-3"
                style={{
                  backgroundColor: "#393f81",
                  borderColor: "#393f81",
                }}
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "Sending..." : "SEND RESET LINK"}
              </MDBBtn>

              <div style={{ marginBottom: "12px" }} />

              <p className="text-center mb-2">
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

export default ForgotPassword;
