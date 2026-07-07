import React from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Navigate to home page after logout
    navigate('/');
  };

  const handleBackToDashboard = () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      navigate('/admin');
    } else if (user?.role === 'client') {
      navigate('/client');
    }
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container-fluid">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>

          {/* 🔹 Logo + Brand */}
          <Link
            to="/"
            onClick={() => handleScroll("home")}
            className="navbar-brand page-scroll"
          >
            <img
              src="/img/logo.jpg"
              alt="Burguret Logo"
              style={{
                height: "40px",
                marginRight: "10px",
                display: "inline-block",
                verticalAlign: "middle",
                paddingLeft: "150px",
              }}
            />
            Burguret Water Project
          </Link>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul
            className="nav navbar-nav navbar-right"
            style={{ display: "flex", flexWrap: "wrap", paddingRight: "150px" }}
          >
            {/* Internal sections (scrolling) → highlight only if we're on "/" */}
            {[
              { id: "about", label: t("About") },
              { id: "features", label: t("Features") },
              { id: "services", label: t("Services") },
              { id: "portfolio", label: t("Gallery") },
              { id: "contact", label: t("Contact") },
            ].map(({ id, label }) => (
              <li key={id} className="nav-item">
                <Link
                  to="/"
                  onClick={() => handleScroll(id)}
                  className={`nav-link ${
                    location.pathname === "/" &&
                    window.location.hash === `#${id}`
                      ? "active"
                      : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}

            {/* Standalone pages → use NavLink for active highlighting */}
            <li className="nav-item">
              <NavLink
                to="/marketplace"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                {t("Marketplace")}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/blogs"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                {t("Blogs")}
              </NavLink>
            </li>

            {/* Conditional Navigation based on authentication */}
            {user ? (
              // User is logged in - show Back to Dashboard and Logout
              <>
                <li className="nav-item">
                  <button
                    onClick={handleBackToDashboard}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      textDecoration: "none",
                      padding: "15px",
                      fontSize: "inherit",
                    }}
                  >
                    {t("Back to Dashboard")}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="nav-link"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      textDecoration: "none",
                      padding: "15px",
                      fontSize: "inherit",
                    }}
                  >
                    {t("Logout")}
                  </button>
                </li>
              </>
            ) : (
              // User is not logged in - show Register and Login
              <>
                <li className="nav-item">
                  <NavLink
                    to="/register"
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active" : "")
                    }
                  >
                    {t("Register")}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active" : "")
                    }
                  >
                    {t("Login")}
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

// Function to handle scrolling to a section
const handleScroll = (sectionId: string) => {
  setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.location.hash = sectionId; // 👈 update hash for active check
    }
  }, 10);
};
