import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { MDBContainer, MDBRow, MDBCol, MDBTypography, MDBInput, MDBBtn, MDBCheckbox } from "mdb-react-ui-kit";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { loginRequest, setAuthToken, setRefreshToken, clearRefreshToken } from "../utils/api";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { setAppLanguage } from '../utils/i18nHelper';

// Form errors type
interface FormErrors {
  [key: string]: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState(""); // Phone number or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();
  const [lang, setLang] = useState<string>((i18n.language && i18n.language.slice(0,2)) || 'en');

  const handleLangChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLang(newLang);
    await setAppLanguage(newLang, { persistBackend: false });
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Phone validation (Kenyan format)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Accept various Kenyan phone number formats
    const validPatterns = [
      /^254[7]\d{8}$/,   // 254712345678
      /^0[7]\d{8}$/,     // 0712345678
      /^[7]\d{8}$/       // 712345678
    ];
    
    return validPatterns.some(pattern => pattern.test(cleaned));
  };

  // Normalize phone number to backend format
  const normalizePhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to international format (+254712345678)
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.length === 9 && /^[7]/.test(cleaned)) {
      return `+254${cleaned}`;
    }
    
    return phone; // Return original if can't normalize
  };

  // Password validation (for login, just check if not empty)
  const validatePassword = (password: string): boolean => {
    return password.trim().length >= 1; // Just ensure it's not empty for login
  };

  // Form validation
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Identifier validation (email or phone)
    if (!identifier.trim()) {
      newErrors.identifier = t("Email or Phone Number is required");
    } else if (!validateEmail(identifier) && !validatePhone(identifier)) {
      newErrors.identifier = t("Please enter a valid email address or Kenyan phone number (e.g., 0712345678)");
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = t("Password is required");
    }

    return newErrors;
  };

  // Handle login - call backend API and route based on user role
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const validationErrors = validateForm();
    setErrors(validationErrors);
    console.log("Validation errors on submit:", validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);
      
      try {
        const isPhone = validatePhone(identifier);
        const loginData = {
          phone: isPhone ? normalizePhone(identifier) : undefined,
          email: !isPhone ? identifier.trim() : undefined,
          password: password
        };

        const data = await loginRequest(loginData);

        if (data.success && data.data) {
          const user = data.data.user;
          const token = data.data.token;
          const refreshToken = data.data.refresh_token;

          const userData = {
            id: user.id.toString(),
            phone: user.phone,
            email: user.email,
            role: user.role as "admin" | "client" | "super_admin",
            account_type: user.account_type,
            status: user.status,
            token,
            ...user,
            name: user.full_name || user.first_name || user.contact_person || 'User',
            accountType: user.account_type
          };

          setAuthToken(token);
          if (rememberMe && refreshToken) {
            setRefreshToken(refreshToken);
          } else {
            clearRefreshToken();
          }

          login(userData);

          alert(t("✅ Welcome back, {{name}}!", { name: userData.name }));

          if (userData.role === 'admin' || userData.role === 'super_admin') {
            navigate('/admin');
          } else {
            navigate('/client');
          }
        } else {
          setErrors({
            submit: data.message || t('Login failed. Please check your credentials and try again.')
          });
        }
      } catch (error: any) {
        console.error("Login error:", error);
        const errorMessage = error?.message || 'Unknown error occurred';
        setErrors({
          submit: t('Login error: {{error}}.', { error: errorMessage })
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Form has errors, submission blocked.");
    }
  };

  // Clear error when user starts typing
  const handleIdentifierChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    
    // Clear errors when input becomes valid
    if (value.trim() !== '' && (validateEmail(value) || validatePhone(value))) {
      setErrors(prev => ({ ...prev, identifier: '', submit: '' }));
    } else {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear errors when password is entered
    if (value.trim() !== '') {
      setErrors(prev => ({ ...prev, password: '', submit: '' }));
    } else {
      setErrors(prev => ({ ...prev, submit: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value) {
      const fieldErrors = validateForm();
      if (fieldErrors[name as keyof FormErrors]) {
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
      }
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  
  // Check if form is valid for submission
  const isFormValid = identifier.trim() !== '' && password.trim() !== '' && 
                     (validateEmail(identifier) || validatePhone(identifier));

  // Debug logging (remove in production)
  React.useEffect(() => {
    console.log('Login form state:', {
      identifier: identifier,
      password: password ? '***' : '',
      hasErrors: hasErrors,
      isFormValid: isFormValid,
      errors: errors
    });
  }, [identifier, password, hasErrors, isFormValid, errors]);

  const getInputClass = (field: string) => (submitted || errors[field]) ? "is-invalid" : "";

  return (
    <MDBContainer
        fluid
        style={{
        backgroundImage: "url('/img/waterbg.jpg')",
        backgroundSize: "cover",        // make sure it covers full container
        backgroundPosition: "center",   // center the image
        backgroundRepeat: "no-repeat",  // prevent tiling
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

        {/* RIGHT COLUMN */}
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
              justifyContent: "center",   // keep horizontal centering
              alignItems: "flex-start",   // 👈 push content to top
            }}
          >
            {/* FORM CONTENT */}
            <div style={{ width: "300px", textAlign: "center", marginTop: "120px" }}>
              <div style={{ marginBottom: "30px" }}>
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <select value={lang} onChange={handleLangChange} style={{ padding: '6px', borderRadius: 6 }}>
                    <option value="en">English</option>
                    <option value="sw">Kiswahili</option>
                    <option value="fr">Français</option>
                    <option value="ar">عربى</option>
                  </select>
                </div>
                <img
                  src="/img/logo.jpg"
                  alt="Logo"
                  style={{ width: "120px" }}
                />
                <MDBTypography tag="h3" className="mb-0">
                  {/* Logo */}
                  {t("BURGURET WATER PROJECT")}
                </MDBTypography>
              </div>

              <MDBTypography tag="h5" className="mb-4" style={{paddingTop: "20px", paddingBottom: "20px"}}>
                {t("Sign into your account")}
              </MDBTypography>

              <form onSubmit={handleSubmit}>
                <MDBInput
                  wrapperClass={`mb-4 ${getInputClass("identifier")}`}
                  placeholder={t("Email or Phone Number")}
                  type="text"
                  style={{ width: "100%", marginBottom: "15px"  }}
                  value={identifier}
                  onChange={handleIdentifierChange}
                  onBlur={handleBlur}
                  name="identifier"
                  required
                />
                {errors.identifier && <div className="text-danger mb-2" style={{ fontSize: "12px", marginBottom: "15px" }}>{errors.identifier}</div>}
                
                {/* Password Input with Visibility Toggle */}
                <div style={{ position: "relative", marginBottom: "15px" }}>
                  <MDBInput
                    wrapperClass={`mb-4 ${getInputClass("password")}`}
                    placeholder={t("Password")}
                    type={showPassword ? "text" : "password"}
                    style={{ width: "100%", paddingRight: "50px" }}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handleBlur}
                    name="password"
                    required
                  />
                  <IconButton
                    onClick={togglePasswordVisibility}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      padding: "4px",
                      color: "#6c757d",
                      zIndex: 10
                    }}
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </div>
                {errors.password && <div className="text-danger mb-2" style={{ fontSize: "12px", marginBottom: "15px" }}>{errors.password}</div>}
                
                {errors.submit && <div className="text-danger mb-3 text-center" style={{ fontSize: "12px", marginBottom: "15px" }}>{errors.submit}</div>}
                
                <button
                  className="w-100 mb-4"
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  style={{
                    width: "100%",
                    marginBottom: "30px",
                    padding: "12px 24px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    borderRadius: "8px",
                    backgroundColor: (!isFormValid || isLoading) ? "#ccc" : "#4caf50",
                    border: `2px solid ${(!isFormValid || isLoading) ? "#ccc" : "#4caf50"}`,
                    color: "white",
                    cursor: (!isFormValid || isLoading) ? "not-allowed" : "pointer",
                    transition: "none",
                    boxSizing: "border-box",
                    outline: "none",
                    boxShadow: (!isFormValid || isLoading) ? "none" : "0 4px 12px rgba(76, 175, 80, 0.3)",
                  }}
                >
                  {isLoading ? t("LOGGING IN...") : t("LOGIN")}
                </button>
              </form>
              
              {/* Remember Me */}
              <div className="d-flex justify-content-center mb-3" style={{marginBottom: "40px"}}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <MDBCheckbox
                    name="Remember me"
                    id="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span style={{ marginLeft: "20px" }}>{t("Remember me")}</span>
                </label>
              </div>

              <p className="text-center mb-2" style={{ marginBottom: "30px" }}>
                <a
                  href="/forgotpassword"
                  style={{
                    textDecoration: "none",
                    color: "#0d6efd",   // brighter blue (Bootstrap primary)
                    fontWeight: "500",  // make it a bit bolder
                  }}
                >
                  Forgot password?
                </a>
              </p>


              <p className="text-center mb-2" style={{ marginBottom: "30px" }}>
                {t("Don't have an account?")} <a href="/register">{t("Register here")}</a>
              </p>
              <p className="text-center text-muted">
                {t("Terms of use.")} {t("Privacy policy")}
              </p>
            </div>
          </div>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Login;