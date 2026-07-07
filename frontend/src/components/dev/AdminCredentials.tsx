import React, { useState } from "react";
import { MDBCard, MDBCardBody, MDBBtn, MDBIcon } from "mdb-react-ui-kit";

// Mock admin accounts for development
const DEFAULT_ADMIN_ACCOUNTS = [
  {
    id: "admin-001",
    name: "System Administrator",
    email: "admin@village-water.com",
    department: "IT",
  },
  {
    id: "admin-002", 
    name: "Water Manager",
    email: "water.manager@village-water.com",
    department: "Operations",
  },
  {
    id: "admin-003",
    name: "Finance Admin",
    email: "finance@village-water.com", 
    department: "Finance",
  }
];

// Development component to display admin credentials
// Remove this in production!
const AdminCredentials: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      <MDBBtn
        color="info"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        style={{ marginBottom: "10px" }}
      >
        <MDBIcon icon="key" className="me-2" />
        {isVisible ? "Hide" : "Show"} Admin Credentials
      </MDBBtn>

      {isVisible && (
        <MDBCard style={{ width: "300px", maxHeight: "400px", overflowY: "auto" }}>
          <MDBCardBody>
            <h6 className="text-center mb-3">
              <MDBIcon icon="exclamation-triangle" className="text-warning me-2" />
              Development Only
            </h6>
            <p style={{ fontSize: "12px", marginBottom: "15px" }}>
              Use these credentials to test admin login:
            </p>
            
            {DEFAULT_ADMIN_ACCOUNTS.map((admin, index) => (
              <div key={admin.id} className="mb-3 p-2" style={{ backgroundColor: "#f8f9fa", borderRadius: "5px" }}>
                <div style={{ fontSize: "12px" }}>
                  <strong>{admin.name}</strong><br />
                  <span className="text-muted">Email:</span> {admin.email}<br />
                  <span className="text-muted">Password:</span> <code>admin123</code><br />
                  <span className="text-muted">Dept:</span> {admin.department}
                </div>
              </div>
            ))}
            
            <div className="alert alert-warning p-2 mt-3" style={{ fontSize: "11px" }}>
              <MDBIcon icon="info-circle" className="me-1" />
              Any password ≥6 chars works for development
            </div>
          </MDBCardBody>
        </MDBCard>
      )}
    </div>
  );
};

export default AdminCredentials;