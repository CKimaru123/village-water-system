import React from "react";
import { MDBContainer, MDBRow, MDBCol, MDBTypography, MDBInput, MDBBtn } from "mdb-react-ui-kit";

const Login: React.FC = () => {
  return (
    <MDBContainer
      fluid
      style={{
        backgroundColor: "#9A616D",
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
                <img
                  src="https://via.placeholder.com/50x50.png?text=Logo"
                  alt="Logo"
                  style={{ width: "50px" }}
                />
                <MDBTypography tag="h3" className="mb-0">
                  Logo
                </MDBTypography>
              </div>

              <MDBTypography tag="h5" className="mb-4" style={{paddingTop: "20px", paddingBottom: "20px"}}>
                Sign into your account
              </MDBTypography>

              <MDBInput
                placeholder="Email address"
                type="email"
                className="mb-4"
                style={{ width: "100%", marginBottom: "30px"  }}
              />
              <MDBInput
                placeholder="Password"
                type="password"
                className="mb-4"
                style={{ width: "100%", marginBottom: "30px"  }}
              />
              <MDBBtn
                className="w-100 mb-4"
                style={{
                  width: "100%",
                  marginBottom: "30px",
                  backgroundColor: "#393f81", // 👈 custom background
                  borderColor: "#393f81",     // 👈 match border color
                }}
              >
                LOGIN
              </MDBBtn>


              <p className="text-center mb-2" style={{ marginBottom: "30px" }}>Forgot password?</p>
              <p className="text-center mb-2" style={{ marginBottom: "30px" }}>
                Don't have an account? <a href="#register">Register here</a>
              </p>
              <p className="text-center text-muted">
                Terms of use. Privacy policy
              </p>
            </div>
          </div>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Login;


import React from "react";
import { Link } from "react-router-dom";

interface NavigationProps {
  // Define any props if needed
}

export const Navigation: React.FC<NavigationProps> = (props) => {
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
          <Link to="/" onClick={() => handleScroll("home")} className="navbar-brand page-scroll">
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
          <ul className="nav navbar-nav navbar-right" style={{ display: "flex", flexWrap: "wrap", paddingRight: "150px" }}>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("about")} className="nav-link">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("features")} className="nav-link">
                Features
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("services")} className="nav-link">
                Services
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("portfolio")} className="nav-link">
                Gallery
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("blogs")} className="nav-link">
                Blogs
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("marketplace")} className="nav-link">
                MarketPlace
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/" onClick={() => handleScroll("contact")} className="nav-link">
                Contact
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/signup" className="nav-link">
                Signup
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="nav-link">
                Login
              </Link>
            </li>
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
    }
  }, 10); // Small delay to allow route change
};