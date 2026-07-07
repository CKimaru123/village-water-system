import React, { useState } from "react";
import { MDBContainer, MDBRow, MDBCol, MDBTypography, MDBInput, MDBBtn, MDBCheckbox, MDBRadio, MDBIcon } from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";
import AdminCredentials from "../components/dev/AdminCredentials";

interface LoginForm {
  email: string;
  password: string;
  role: "admin" | "client";
  rememberMe: boolean;
}

interface LoginErrors {
  [key: string]: string;
}

const LoginImproved: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
    role: "client",
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // TODO: Replace with actual API call to backend
      console.log("Login attempt:", { ...formData, password: "[HIDDEN]" });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simple validation for development
      if (formData.role === "admin") {
        // Check if email contains "admin" for simple admin detection
        if (!formData.email.toLowerCase().includes('admin')) {
          setErrors({ submit: "Admin account not found. Use an email containing 'admin'." });
          return;
        }

        if (formData.password.length < 6) {
          setErrors({ submit: "Invalid admin credentials." });
          return;
        }

        // Redirect to admin dashboard
        window.location.href = 'http://localhost:5000';
      } else {
        // Client login - for now just show success message
        alert('Client login successful! Client dashboard not yet implemented.');
        // TODO: Implement client dashboard redirect
      }
      
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ submit: "Login failed. Please check your credentials and try again." });
    } finally {
      setIsLoading(false);
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
        {/* LEFT COLUMN - Image */}
        <MDBCol
          md="6"
          style={{
            position: "relative",
            height: "100%",
            margin: "0",
            padding: "0",
          }}
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

        {/* RIGHT COLUMN - Login Form */}
        <MDBCol
          md="6"
          style={{
            position: "relative",
            height: "100%",
            margin: "0",
            padding: "0",
          }}
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
            {/* FORM CONTENT */}
            <div style={{ width: "300px", textAlign: "center", marginTop: "80px" }}>
              {/* Logo */}
              <div style={{ marginBottom: "30px" }}>
                <img
                  src="/img/logo.jpg"
                  alt="Logo"
                  style={{ width: "120px" }}
                />
                <MDBTypography tag="h3" className="mb-0">
                  Village Water System
                </MDBTypography>
              </div>

              <MDBTypography tag="h5" className="mb-4" style={{paddingTop: "20px", paddingBottom: "20px"}}>
                Sign into your account
              </MDBTypography>

              {/* Role Selection */}
              <div className="d-flex justify-content-center mb-4" style={{ gap: "60px", padding: "0 20px" }}>
                <div style={{paddingRight: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <MDBRadio
                      name="role"
                      id="client"
                      value="client"
                      inline
                      checked={formData.role === "client"}
                      onChange={handleChange}
                    />
                    <span style={{ marginLeft: "8px", fontSize: "14px" }}>Client</span>
                  </label>
                </div>
                <div style={{paddingLeft: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <MDBRadio
                      name="role"
                      id="admin"
                      value="admin"
                      inline
                      checked={formData.role === "admin"}
                      onChange={handleChange}
                    />
                    <span style={{ marginLeft: "8px", fontSize: "14px" }}>Admin</span>
                  </label>
                </div>
              </div>

              {/* Global Error Message */}
              {errors.submit && (
                <div className="alert alert-danger mb-3" style={{ fontSize: "14px", padding: "8px" }}>
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleLogin}>
                {/* Email Input */}
                <MDBInput
                  placeholder="Email address"
                  type="email"
                  className="mb-4"
                  style={{ width: "100%", marginBottom: "20px" }}
                  value={formData.email}
                  onChange={handleChange}
                  name="email"
                  required
                />
                {errors.email && <div className="text-danger mb-2" style={{ fontSize: "12px", textAlign: "left" }}>{errors.email}</div>}
                
                {/* Password Input */}
                <div style={{ position: "relative", marginBottom: "20px" }}>
                  <MDBInput
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    className="mb-4"
                    style={{ width: "100%" }}
                    value={formData.password}
                    onChange={handleChange}
                    name="password"
                    required
                  />
                  <MDBIcon
                    icon={showPassword ? "eye-slash" : "eye"}
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      color: "#6c757d"
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
                {errors.password && <div className="text-danger mb-2" style={{ fontSize: "12px", textAlign: "left" }}>{errors.password}</div>}

                {/* Login Button */}
                <MDBBtn
                  type="submit"
                  className="w-100 mb-4"
                  style={{
                    width: "100%",
                    marginBottom: "30px",
                    backgroundColor: "#393f81",
                    borderColor: "#393f81",
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "LOGGING IN..." : "LOGIN"}
                </MDBBtn>
              </form>
              
              {/* Remember Me */}
              <div className="d-flex justify-content-center mb-3" style={{marginBottom: "30px"}}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <MDBCheckbox
                    name="rememberMe"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span style={{ marginLeft: "20px", fontSize: "14px" }}>Remember me</span>
                </label>
              </div>

              {/* Links */}
              <p className="text-center mb-2" style={{ marginBottom: "20px" }}>
                <a
                  href="/forgotpassword"
                  style={{
                    textDecoration: "none",
                    color: "#0d6efd",
                    fontWeight: "500",
                    fontSize: "14px"
                  }}
                >
                  Forgot password?
                </a>
              </p>

              <p className="text-center mb-2" style={{ marginBottom: "20px", fontSize: "14px" }}>
                Don't have an account? <a href="/signup">Register here</a>
              </p>

              {/* Admin Note */}
              {formData.role === "admin" && (
                <div className="alert alert-info mt-3" style={{ fontSize: "12px", padding: "8px" }}>
                  <strong>Admin Access:</strong> Contact your system administrator for login credentials.
                </div>
              )}

              <p className="text-center text-muted" style={{ fontSize: "12px", marginTop: "20px" }}>
                Terms of use. Privacy policy
              </p>
            </div>
          </div>
        </MDBCol>
      </MDBRow>
      
      {/* Development Admin Credentials Helper */}
      <AdminCredentials />
    </MDBContainer>
  );
};

export default LoginImproved;