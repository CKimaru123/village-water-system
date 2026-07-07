// import React, { useState, ChangeEvent, FormEvent } from "react";
// import {
//   MDBBtn,
//   MDBContainer,
//   MDBCard,
//   MDBCardBody,
//   MDBInput,
//   MDBCheckbox,
//   MDBRadio,
// } from "mdb-react-ui-kit";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faFacebook,
//   faGoogle,
//   faXTwitter,
//   faYoutube,
// } from "@fortawesome/free-brands-svg-icons";

// // Form state type
// interface SignupForm {
//   accountType: "household" | "institution";
//   subscribe?: boolean;
//   firstName?: string;
//   lastName?: string;
//   phone: string;
//   altPhone?: string;
//   email?: string;
//   password: string;
//   confirmPassword: string;
//   plotNumber?: string;
//   householdSize?: string;
//   village?: string;

//   institutionName?: string;
//   institutionType?: string;
//   contactPerson?: string;
//   altContact?: string;
//   populationServed?: string;
//   storageCapacity?: string;

//   communication?: string;
//   landmark?: string;
// }

// // Errors type
// interface FormErrors {
//   [key: string]: string;
// }

// const Signup: React.FC = () => {
//   const [formData, setFormData] = useState<SignupForm>({
//     accountType: "household",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//     subscribe: false,
//   });
//   const [errors, setErrors] = useState<FormErrors>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   const validateEmail = (email: string): boolean => {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
//   };

//   const validatePhone = (phone: string): boolean => {
//     const cleaned = phone.replace(/\D/g, '');
//     return cleaned.length >= 10 && cleaned.length <= 15;
//   };

//   const validateNumber = (value: string): boolean => {
//     const num = parseInt(value, 10);
//     return !isNaN(num) && num > 0;
//   };

//   const validatePassword = (password: string): boolean => {
//     // At least 8 characters, one uppercase, one lowercase, one number, one special char
//     const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     return re.test(password);
//   };

//   const validateName = (name: string): boolean => {
//     // Allow letters, spaces, hyphens, apostrophes; no numbers
//     const re = /^[a-zA-Z\s'-]+$/;
//     return re.test(name.trim()) && name.trim().length >= 2;
//   };

//   const validateForm = (partial = false): FormErrors => {
//     const newErrors: FormErrors = {};

//     // Common validations
//     if (!formData.phone || !validatePhone(formData.phone)) {
//       newErrors.phone = "Valid phone number (10-15 digits) is required.";
//     }
//     if (formData.email && !validateEmail(formData.email)) {
//       newErrors.email = "Invalid email format.";
//     }
//     if (!formData.password || !validatePassword(formData.password)) {
//       newErrors.password = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (e.g., !@#$%).";
//     }
//     if (formData.confirmPassword !== formData.password) {
//       newErrors.confirmPassword = "Passwords do not match.";
//     }
//     if (!formData.communication?.trim()) {
//       newErrors.communication = "Please select a communication method.";
//     }

//     // Household specific
//     if (formData.accountType === "household") {
//       if (formData.firstName && !validateName(formData.firstName)) {
//         newErrors.firstName = "First name must contain only letters (min 2 chars).";
//       } else if (!formData.firstName?.trim()) {
//         newErrors.firstName = "First name is required.";
//       }
//       if (formData.lastName && !validateName(formData.lastName)) {
//         newErrors.lastName = "Last name must contain only letters (min 2 chars).";
//       } else if (!formData.lastName?.trim()) {
//         newErrors.lastName = "Last name is required.";
//       }
//       if (!formData.altPhone || !validatePhone(formData.altPhone)) {
//         newErrors.altPhone = "Valid alternative phone is required.";
//       }
//       if (!formData.plotNumber?.trim()) newErrors.plotNumber = "Plot number is required.";
//       if (!formData.householdSize || !validateNumber(formData.householdSize)) {
//         newErrors.householdSize = "Valid household size (>0) is required.";
//       }
//       if (!formData.village?.trim()) newErrors.village = "Village/location is required.";
//     }

//     // Institution specific
//     if (formData.accountType === "institution") {
//       if (formData.institutionName && !formData.institutionName.trim()) {
//         newErrors.institutionName = "Institution name is required.";
//       }
//       if (!formData.institutionType?.trim()) newErrors.institutionType = "Institution type is required.";
//       if (formData.contactPerson && !validateName(formData.contactPerson)) {
//         newErrors.contactPerson = "Contact person name must contain only letters (min 2 chars).";
//       } else if (!formData.contactPerson?.trim()) {
//         newErrors.contactPerson = "Contact person is required.";
//       }
//       if (formData.altContact && !validatePhone(formData.altContact)) {
//         newErrors.altContact = "Invalid alternative contact phone.";
//       }
//       if (formData.populationServed && !validateNumber(formData.populationServed)) {
//         newErrors.populationServed = "Valid population served (>0) is required.";
//       }
//     }

//     return newErrors;
//   };

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear error on change and validate partially if needed
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       delete newErrors[name];
//       // Optional: Run partial validation on change for immediate feedback
//       if (value) {
//         const partialErrors = validateForm(true);
//         if (partialErrors[name]) {
//           newErrors[name] = partialErrors[name];
//         }
//       }
//       return newErrors;
//     });
//   };

//   const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     if (value) {
//       const fieldErrors = validateForm(true);
//       if (fieldErrors[name]) {
//         setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
//       }
//     }
//   };

//   const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, checked } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: checked }));
//   };

//   const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear account-specific errors on type change
//     const householdKeys = ["firstName", "lastName", "altPhone", "plotNumber", "householdSize", "village"];
//     const institutionKeys = ["institutionName", "institutionType", "contactPerson", "altContact", "populationServed"];
//     setErrors((prev) => {
//       const newErrors = { ...prev };
//       if (value === "household") {
//         institutionKeys.forEach(key => delete newErrors[key]);
//       } else {
//         householdKeys.forEach(key => delete newErrors[key]);
//       }
//       return newErrors;
//     });
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setSubmitted(true);
//     const validationErrors = validateForm();
//     setErrors(validationErrors);
//     console.log("Validation errors on submit:", validationErrors); // Debug log

//     if (Object.keys(validationErrors).length === 0) {
//       setIsSubmitting(true);
//       try {
//         // Simulate API call
//         console.log("Form submitted:", formData);
//         // In production, send to backend
//         // await fetch('/api/signup', { method: 'POST', body: JSON.stringify(formData) });
//         // Redirect after success
//         window.location.href = 'http://localhost:5000';
//       } catch (error) {
//         console.error("Submission error:", error);
//       } finally {
//         setIsSubmitting(false);
//       }
//     } else {
//       console.log("Form has errors, submission blocked."); // Debug log
//     }
//   };

//   const hasErrors = Object.keys(errors).length > 0;

//   const getGroupClass = (field: string) => (submitted || errors[field]) ? "is-invalid" : "";

//   return (
//     <MDBContainer fluid className="p-0" style={{ backgroundColor: "#f5f6fa" }}>
//       {/* Background Image */}
//       <div
//         className="bg-image"
//         style={{
//           backgroundImage: "url('/img/waterbg.jpg')",
//           height: "100vh",
//           width: "100%",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           backgroundRepeat: "no-repeat"
//         }}
//       ></div>

//       {/* Centered card */}
//       <div className="d-flex justify-content-center" style={{ marginTop: "-850px" }}>
//         <MDBCard
//           className="shadow-5 w-100"
//           style={{
//             maxWidth: "700px",
//             borderRadius: "15px",
//             background: "hsla(0, 0%, 100%, 0.95)",
//             backdropFilter: "blur(30px)",
//             margin: "auto",
//           }}
//         >
//           <MDBCardBody className="p-4">
//             <h2 className="fw-bold mb-4 text-center" style={{paddingTop: "30px"}}>Sign up now</h2>

//             <form onSubmit={handleSubmit}>
//               {/* Step 1: Choose type */}
//               <div 
//                 className="d-flex justify-content-center align-items-center mb-4" 
//                 style={{ paddingLeft: "50px", paddingRight: "50px", marginTop: "50px", gap: "80px" }}
//               >
//                 <div className="form-check" style={{ display: "inline-flex", alignItems: "center", paddingRight: "80px" }}>
//                   <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
//                     <MDBRadio
//                       name="accountType"
//                       id="household"
//                       value="household"
//                       inline
//                       checked={formData.accountType === "household"}
//                       onChange={handleRadioChange}
//                     />
//                     <span style={{ marginLeft: "20px" }}>Household</span>
//                   </label>
//                 </div>
//                 <div className="form-check" style={{ display: "inline-flex", alignItems: "center" }}>
//                   <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
//                     <MDBRadio
//                       name="accountType"
//                       id="institution"
//                       value="institution"
//                       inline
//                       checked={formData.accountType === "institution"}
//                       onChange={handleRadioChange}
//                     />
//                     <span style={{ marginLeft: "20px" }}>Institution</span>
//                   </label>
//                 </div>
//               </div>

//               {/* Household fields */}
//               {formData.accountType === "household" && (
//                 <div style={{ paddingLeft: "50px", paddingRight: "50px"}}>
//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("firstName")}`}
//                     placeholder="First Name *"
//                     name="firstName"
//                     value={formData.firstName || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.firstName && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.firstName}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("lastName")}`}
//                     placeholder="Last Name *"
//                     name="lastName"
//                     value={formData.lastName || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.lastName && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.lastName}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("phone")}`}
//                     placeholder="Phone Number *"
//                     name="phone"
//                     type="tel"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.phone && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.phone}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("altPhone")}`}
//                     placeholder="Alternative Household Member + Phone *"
//                     name="altPhone"
//                     type="tel"
//                     value={formData.altPhone || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.altPhone && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.altPhone}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("email")}`}
//                     placeholder="Email (optional)"
//                     name="email"
//                     type="email"
//                     value={formData.email || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.email && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.email}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("plotNumber")}`}
//                     placeholder="Land / Plot Number *"
//                     name="plotNumber"
//                     value={formData.plotNumber || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.plotNumber && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.plotNumber}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("householdSize")}`}
//                     placeholder="Household Size *"
//                     name="householdSize"
//                     type="number"
//                     value={formData.householdSize || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.householdSize && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.householdSize}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("village")}`}
//                     placeholder="Village / Location *"
//                     name="village"
//                     value={formData.village || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.village && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.village}</div>}
//                 </div>
//               )}

//               {/* Institution fields */}
//               {formData.accountType === "institution" && (
//                 <div style={{ paddingLeft: "50px", paddingRight: "50px"}}>
//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("institutionName")}`}
//                     placeholder="Institution Name *"
//                     name="institutionName"
//                     value={formData.institutionName || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.institutionName && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.institutionName}</div>}

//                   <div className={`mb-3 my-3 ${getGroupClass("institutionType")}`} style={{ margin: "20px 0" }}>
//                     <label htmlFor="institutionType" style={{ fontSize: "10pt" }}>
//                       Type of Institution *
//                     </label>
//                     <select
//                       id="institutionType"
//                       name="institutionType"
//                       value={formData.institutionType || ""}
//                       onChange={handleChange}
//                       onBlur={handleBlur}
//                       className={`form-control ${errors.institutionType ? "is-invalid" : ""}`}
//                       required
//                       style={{ padding: "6px 12px", width: "100%" }}
//                     >
//                       <option value="">Select an option</option>
//                       <option value="School">School</option>
//                       <option value="Dispensary">Dispensary</option>
//                       <option value="Church">Church</option>
//                       <option value="Other">Other</option>
//                     </select>
//                     {errors.institutionType && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545" }}>{errors.institutionType}</div>}
//                   </div>

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("contactPerson")}`}
//                     placeholder="Contact Person Name *"
//                     name="contactPerson"
//                     value={formData.contactPerson || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.contactPerson && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.contactPerson}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("phone")}`}
//                     placeholder="Contact Phone *"
//                     name="phone"
//                     type="tel"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     required
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.phone && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.phone}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("altContact")}`}
//                     placeholder="Alternative Contact Phone"
//                     name="altContact"
//                     type="tel"
//                     value={formData.altContact || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     style={{ margin: "20px 0" }} 
//                   />
//                   {errors.altContact && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.altContact}</div>}

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("email")}`}
//                     placeholder="Email (optional)"
//                     name="email"
//                     type="email"
//                     value={formData.email || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.email && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.email}</div>}

//                   <MDBInput
//                     wrapperClass="mb-3 my-3"
//                     placeholder="Plot Number / Location"
//                     name="plotNumber"
//                     value={formData.plotNumber || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     style={{ margin: "20px 0" }}
//                   />

//                   <MDBInput
//                     wrapperClass={`mb-3 my-3 ${getGroupClass("populationServed")}`}
//                     placeholder="Population Served"
//                     name="populationServed"
//                     type="number"
//                     value={formData.populationServed || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     style={{ margin: "20px 0" }}
//                   />
//                   {errors.populationServed && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.populationServed}</div>}

//                   <MDBInput
//                     wrapperClass="mb-3 my-3"
//                     placeholder="Storage Capacity (optional)"
//                     name="storageCapacity"
//                     value={formData.storageCapacity || ""}
//                     onChange={handleChange}
//                     style={{ margin: "20px 0" }}
//                   />
//                 </div>
//               )}

//               {/* Common fields */}
//               <div style={{ paddingLeft: "50px", paddingRight: "50px" }}>
//                 <div className={`mb-3 my-3 ${getGroupClass("communication")}`} style={{ margin: "20px 0" }}>
//                   <label htmlFor="communication" style={{ fontSize: "10pt" }}>
//                     Preferred Communication Method *
//                   </label>
//                   <select
//                     id="communication"
//                     name="communication"
//                     value={formData.communication || ""}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     className={`form-control ${errors.communication ? "is-invalid" : ""}`}
//                     style={{ padding: "6px 12px", width: "100%" }}
//                   >
//                     <option value="">Select an option</option>
//                     <option value="SMS">SMS</option>
//                     <option value="WhatsApp">WhatsApp</option>
//                     <option value="Call">Call</option>
//                     <option value="Email">Email</option>
//                   </select>
//                   {errors.communication && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545" }}>{errors.communication}</div>}
//                 </div>

//                 <MDBInput
//                   wrapperClass="mb-3 my-3"
//                   placeholder="Nearest Landmark (optional)"
//                   name="landmark"
//                   value={formData.landmark || ""}
//                   onChange={handleChange}
//                   style={{ margin: "20px 0" }}
//                 />

//                 {/* Password fields */}
//                 <MDBInput
//                   wrapperClass={`mb-3 my-3 ${getGroupClass("password")}`}
//                   placeholder="Password *"
//                   name="password"
//                   type="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   required
//                   style={{ margin: "20px 0" }}
//                 />
//                 {errors.password && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.password}</div>}

//                 <MDBInput
//                   wrapperClass={`mb-3 my-3 ${getGroupClass("confirmPassword")}`}
//                   placeholder="Confirm Password *"
//                   name="confirmPassword"
//                   type="password"
//                   value={formData.confirmPassword}
//                   onChange={handleChange}
//                   onBlur={handleBlur}
//                   required
//                   style={{ margin: "20px 0" }}
//                 />
//                 {errors.confirmPassword && <div className="invalid-feedback d-block" style={{ fontSize: "0.875em", color: "#dc3545", marginTop: "-10px", marginBottom: "10px" }}>{errors.confirmPassword}</div>}

//                 {/* Newsletter */}
//                 <div className="d-flex justify-content-center mb-3">
//                   <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
//                     <MDBCheckbox
//                       name="subscribe"
//                       id="subscribe"
//                       checked={formData.subscribe || false}
//                       onChange={handleCheckboxChange}
//                     />
//                     <span style={{ marginLeft: "20px" }}>Subscribe to our newsletter</span>
//                   </label>
//                 </div>

//                 {/* Submit */}
//                 <div className="d-flex justify-content-center align-items-center" style={{margin: "0 auto", maxWidth: "200px" }}>
//                   <MDBBtn 
//                     className="mb-3" 
//                     type="submit"
//                     disabled={hasErrors || isSubmitting}
//                     style={{ marginTop: "40px", width: "200px", marginBottom: "20px" }}
//                   >
//                     {isSubmitting ? "Signing up..." : "Sign up"}
//                   </MDBBtn>
//                 </div>
//               </div>

//               {/* Social logins (commented out as before) */}
//               {/* ... */}
//             </form>
//           </MDBCardBody>
//         </MDBCard>
//       </div>
//     </MDBContainer>
//   );
// };

// export default Signup;

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signupRequest, setAuthToken, setRefreshToken } from "../utils/api";
import {
  MDBBtn,
  MDBContainer,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBCheckbox,
  MDBRadio,
  MDBProgress,
  MDBProgressBar,
} from "mdb-react-ui-kit";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faGoogle,
  faXTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// Form state type
interface SignupForm {
  accountType: "household" | "institution";
  subscribe?: boolean;
  firstName?: string;
  lastName?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  password: string;
  confirmPassword: string;
  plotNumber?: string;
  householdSize?: string;
  village?: string;

  institutionName?: string;
  institutionType?: string;
  contactPerson?: string;
  altContact?: string;
  populationServed?: string;
  storageCapacity?: string;

  communication?: string;
  landmark?: string;
}

// Errors type
interface FormErrors {
  [key: string]: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState<SignupForm>({
    accountType: "household",
    phone: "",
    password: "",
    confirmPassword: "",
    subscribe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const totalSteps = 4;

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Accept various Kenyan phone number formats
    // Kenyan mobile numbers: 07XX XXX XXX or +254 7XX XXX XXX
    const validPatterns = [
      /^254[7]\d{8}$/,   // 254712345678, 254729123456, etc. (international without +)
      /^0[7]\d{8}$/,     // 0712345678, 0729123456, etc. (local format)
      /^[7]\d{8}$/       // 712345678, 729123456, etc. (without leading 0)
    ];
    
    return validPatterns.some(pattern => pattern.test(cleaned));
  };

  const normalizePhoneForStorage = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Convert to international E.164 format (+254712345678)
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.length === 9 && /^[7]/.test(cleaned)) {
      return `+254${cleaned}`;
    }
    
    return phone; // Return original if can't normalize
  };

  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return '';
    
    const normalized = normalizePhoneForStorage(phone);
    // Convert +254712345678 to 0712 345 678 for display
    if (normalized.startsWith('+254')) {
      const number = normalized.substring(4); // Remove +254
      return `0${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    
    return phone;
  };

  const validateNumber = (value: string): boolean => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
  };

  const validatePassword = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number, one special char
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const validateName = (name: string): boolean => {
    // Allow letters, spaces, hyphens, apostrophes; no numbers
    const re = /^[a-zA-Z\s'-]+$/;
    return re.test(name.trim()) && name.trim().length >= 2;
  };

  const validateStep = (step: number): FormErrors => {
    const newErrors: FormErrors = {};

    if (step >= 1) {
      // Step 1: Account Type (always valid if selected)
      if (!formData.accountType) {
        newErrors.accountType = "Please select an account type.";
      }
    }

    if (step >= 2) {
      // Step 2: Core fields
      if (formData.firstName && !validateName(formData.firstName)) {
        newErrors.firstName = "First name must contain only letters (min 2 chars).";
      } else if (!formData.firstName?.trim()) {
        newErrors.firstName = "First name is required.";
      }
      if (formData.lastName && !validateName(formData.lastName)) {
        newErrors.lastName = "Last name must contain only letters (min 2 chars).";
      } else if (!formData.lastName?.trim()) {
        newErrors.lastName = "Last name is required.";
      }
      if (!formData.phone || !validatePhone(formData.phone)) {
        newErrors.phone = "Valid Kenyan phone number is required (e.g., 0729123456, +254729123456, or 729123456).";
      }
      if (!formData.altPhone || !validatePhone(formData.altPhone)) {
        newErrors.altPhone = "Valid alternative Kenyan phone number is required (e.g., 0729123456, +254729123456, or 729123456).";
      }
      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = "Invalid email format.";
      }
    }

    if (step >= 3) {
      // Step 3: Specific fields
      if (formData.accountType === "household") {
        if (!formData.plotNumber?.trim()) newErrors.plotNumber = "Plot number is required.";
        if (!formData.householdSize || !validateNumber(formData.householdSize)) {
          newErrors.householdSize = "Valid household size (>0) is required.";
        }
        if (!formData.village?.trim()) newErrors.village = "Village/location is required.";
      } else if (formData.accountType === "institution") {
        if (!formData.institutionName?.trim()) newErrors.institutionName = "Institution name is required.";
        if (!formData.institutionType?.trim()) newErrors.institutionType = "Institution type is required.";
        if (formData.contactPerson && !validateName(formData.contactPerson)) {
          newErrors.contactPerson = "Contact person name must contain only letters (min 2 chars).";
        } else if (!formData.contactPerson?.trim()) {
          newErrors.contactPerson = "Contact person is required.";
        }
        if (formData.altContact && !validatePhone(formData.altContact)) {
          newErrors.altContact = "Invalid alternative contact phone number (e.g., 0729123456, +254729123456, or 729123456).";
        }
        if (formData.populationServed && !validateNumber(formData.populationServed)) {
          newErrors.populationServed = "Valid population served (>0) is required.";
        }
      }
    }

    if (step >= 4) {
      // Step 4: Final fields
      if (!formData.communication?.trim()) {
        newErrors.communication = "Please select a communication method.";
      }
      if (!formData.password || !validatePassword(formData.password)) {
        newErrors.password = "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (e.g., !@#$%).";
      }
      if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Passwords do not match.";
      }
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep);
    setErrors(stepErrors);
    setSubmitted(true);

    if (Object.keys(stepErrors).length === 0) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (value) {
      const fieldErrors = validateStep(currentStep);
      if (fieldErrors[name]) {
        setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
      }
    }
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors on type change
    setErrors({});
    setCurrentStep(2); // Advance to next step after selection
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateStep(totalSteps);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      // Show confirmation modal instead of submitting directly
      setShowConfirmModal(true);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Normalize phone numbers before submission
      const normalizedFormData = {
        // Convert camelCase to snake_case for backend
        account_type: formData.accountType,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: normalizePhoneForStorage(formData.phone),
        alt_phone: formData.altPhone ? normalizePhoneForStorage(formData.altPhone) : undefined,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        plot_number: formData.plotNumber,
        household_size: formData.householdSize ? parseInt(formData.householdSize) : undefined,
        village: formData.village,
        
        // Institution fields
        institution_name: formData.institutionName,
        institution_type: formData.institutionType,
        contact_person: formData.contactPerson,
        alt_contact: formData.altContact ? normalizePhoneForStorage(formData.altContact) : undefined,
        population_served: formData.populationServed ? parseInt(formData.populationServed) : undefined,
        storage_capacity: formData.storageCapacity,
        
        // Common fields
        communication_preference: formData.communication,
        landmark: formData.landmark,
        newsletter_subscription: formData.subscribe || false
      };
      
      // Remove undefined values to avoid backend issues
      const cleanedFormData = Object.fromEntries(
        Object.entries(normalizedFormData).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      console.log("Submitting to backend:", cleanedFormData);
      
      // Call the backend API
      const data = await signupRequest(cleanedFormData);
      console.log("Backend response:", data);
      
      if (data.success && data.data) {
        // Success! Use AuthContext to log in the user
        const userData = {
          id: data.data.user.id.toString(),
          phone: data.data.user.phone,
          email: data.data.user.email,
          role: data.data.user.role as "admin" | "client",
          account_type: data.data.user.account_type,
          status: data.data.user.status,
          token: data.data.token,
          
          // Include all user fields from backend
          ...data.data.user,
          
          // Legacy compatibility
          name: data.data.user.full_name || data.data.user.first_name || data.data.user.contact_person || 'User',
          accountType: data.data.user.account_type
        };
        
        // Store token separately
        setAuthToken(data.data.token);
        if (data.data.refresh_token) {
          setRefreshToken(data.data.refresh_token);
        }
        
        // Log in the user using AuthContext
        login(userData);
        
        // Show success message
        alert(`✅ ${data.message}\nWelcome ${userData.name}!\nRole: ${userData.role}`);
        
        // Navigate based on user role
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/client');
        }
      } else {
        // Handle validation errors
        console.error("Signup failed:", data);
        const errorMessage = data.message || 'Signup failed';
        
        if (data.errors) {
          console.error("Validation errors:", data.errors);
          const errorDetails = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          alert(`❌ ${errorMessage}\n\nValidation Details:\n${errorDetails}`);
        } else {
          console.error("Complete error details:", {
            data: data,
            formData: cleanedFormData
          });
          alert(`❌ ${errorMessage}`);
        }

        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Network error: ${errorMessage}\n\nPlease check:\n1. Backend server is running on http://127.0.0.1:3001\n2. Internet connection is stable`);
      setIsSubmitting(false);
    }
  };

  const handleEditForm = () => {
    setShowConfirmModal(false);
    // Stay on current step to allow editing
  };

  const hasErrors = Object.keys(errors).length > 0;
  
  // Check if current step has errors
  const hasCurrentStepErrors = () => {
    const stepErrors = validateStep(currentStep);
    return Object.keys(stepErrors).length > 0;
  };
  
  // Check if entire form is valid for final submission
  const isFormValidForSubmission = () => {
    const allStepsErrors = validateStep(totalSteps); // Validate all steps
    return Object.keys(allStepsErrors).length === 0;
  };

  const getGroupClass = (field: string) => (submitted || errors[field]) ? "is-invalid" : "";

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ 
            padding: "40px 50px", 
            textAlign: "center",
            minHeight: "350px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <h4 className="mb-5" style={{ 
              color: "#2c3e50", 
              fontWeight: "600",
              fontSize: "1.4rem",
              marginBottom: "2.5rem"
            }}>
              Step 1: Choose Account Type
            </h4>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{ 
                marginBottom: "3rem",
                flexWrap: "wrap",
                gap: "50px"
              }}
            >
              <div className="form-check" style={{ margin: "0 25px" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer",
                  padding: "20px 30px",
                  border: "2px solid #e9ecef",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  backgroundColor: formData.accountType === "household" ? "#e3f2fd" : "transparent",
                  borderColor: formData.accountType === "household" ? "#2196f3" : "#e9ecef",
                  minWidth: "160px",
                  boxShadow: formData.accountType === "household" ? "0 4px 12px rgba(33, 150, 243, 0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                  margin: "10px"
                }}>
                  <MDBRadio
                    name="accountType"
                    id="household"
                    value="household"
                    inline
                    checked={formData.accountType === "household"}
                    onChange={handleRadioChange}
                  />
                  <span style={{ 
                    marginLeft: "15px", 
                    fontWeight: "500",
                    fontSize: "1.1rem"
                  }}>
                    Household
                  </span>
                </label>
              </div>
              <div className="form-check" style={{ margin: "0 25px"}}> 
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer",
                  padding: "20px 30px",
                  border: "2px solid #e9ecef",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  backgroundColor: formData.accountType === "institution" ? "#e3f2fd" : "transparent",
                  borderColor: formData.accountType === "institution" ? "#2196f3" : "#e9ecef",
                  minWidth: "160px",
                  boxShadow: formData.accountType === "institution" ? "0 4px 12px rgba(33, 150, 243, 0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                  margin: "10px"
                }}>
                  <MDBRadio
                    name="accountType"
                    id="institution"
                    value="institution"
                    inline
                    checked={formData.accountType === "institution"}
                    onChange={handleRadioChange}
                  />
                  <span style={{ 
                    marginLeft: "15px", 
                    fontWeight: "500",
                    fontSize: "1.1rem"
                  }}>
                    Institution
                  </span>
                </label>
              </div>
            </div>
            {errors.accountType && (
              <div className="text-danger" style={{ 
                fontSize: "0.9em",
                marginTop: "1rem"
              }}>
                {errors.accountType}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div style={{ 
            padding: "30px 50px",
            minHeight: "450px"
          }}>
            <h4 className="mb-4" style={{ 
              color: "#2c3e50", 
              fontWeight: "600",
              fontSize: "1.4rem",
              textAlign: "center",
              marginBottom: "2rem"
            }}>
              Step 2: Personal Information
            </h4>
            
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("firstName")}`}
                placeholder="First Name *"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.firstName && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.firstName}
                </div>
              )}

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("lastName")}`}
                placeholder="Last Name *"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.lastName && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.lastName}
                </div>
              )}

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("phone")}`}
                placeholder="Phone Number * (e.g., 0729123456)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.phone && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.phone}
                </div>
              )}

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("altPhone")}`}
                placeholder="Alternative Household Member + Phone * (e.g., 0729123456)"
                name="altPhone"
                type="tel"
                value={formData.altPhone || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.altPhone && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1.1rem"
                }}>
                  {errors.altPhone}
                </div>
              )}

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("email")}`}
                placeholder="Email (optional)"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.email && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.email}
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ 
            padding: "30px 50px",
            minHeight: "450px"
          }}>
            <h4 className="mb-4" style={{ 
              color: "#2c3e50", 
              fontWeight: "600",
              fontSize: "1.4rem",
              textAlign: "center",
              marginBottom: "2rem"
            }}>
              Step 3: Account Details
            </h4>
            
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              {formData.accountType === "household" && (
                <>
                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("plotNumber")}`}
                    placeholder="Land / Plot Number *"
                    name="plotNumber"
                    value={formData.plotNumber || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.plotNumber && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.plotNumber}
                    </div>
                  )}

                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("householdSize")}`}
                    placeholder="Household Size *"
                    name="householdSize"
                    type="number"
                    value={formData.householdSize || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.householdSize && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.householdSize}
                    </div>
                  )}

                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("village")}`}
                    placeholder="Village / Location *"
                    name="village"
                    value={formData.village || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.village && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.village}
                    </div>
                  )}
                </>
              )}
              {formData.accountType === "institution" && (
                <>
                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("institutionName")}`}
                    placeholder="Institution Name *"
                    name="institutionName"
                    value={formData.institutionName || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.institutionName && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.institutionName}
                    </div>
                  )}

                  <div className={`mb-4 ${getGroupClass("institutionType")}`} style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="institutionType" style={{ 
                      fontSize: "1.1rem",
                      color: "#6c757d",
                      marginBottom: "0.5rem",
                      display: "block"
                    }}>
                      Type of Institution *
                    </label>
                    <select
                      id="institutionType"
                      name="institutionType"
                      value={formData.institutionType || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`form-control ${errors.institutionType ? "is-invalid" : ""}`}
                      required
                      style={{ 
                        padding: "12px 16px", 
                        width: "100%",
                        fontSize: "1.1rem",
                        borderRadius: "8px",
                        border: "1px solid #ced4da",
                        minHeight: "48px",
                        lineHeight: "1.5",
                        backgroundColor: "#fff",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 12px center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "16px",
                        paddingRight: "40px"
                      }}
                    >
                      <option value="" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Select an option</option>
                      <option value="School" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>School</option>
                      <option value="Dispensary" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Dispensary</option>
                      <option value="Church" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Church</option>
                      <option value="Other" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Other</option>
                    </select>
                    {errors.institutionType && (
                      <div className="invalid-feedback d-block" style={{ 
                        fontSize: "0.875em", 
                        color: "#dc3545",
                        marginTop: "0.5rem"
                      }}>
                        {errors.institutionType}
                      </div>
                    )}
                  </div>

                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("contactPerson")}`}
                    placeholder="Contact Person Name *"
                    name="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.contactPerson && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.contactPerson}
                    </div>
                  )}

                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("altContact")}`}
                    placeholder="Alternative Contact Phone (e.g., 0729123456)"
                    name="altContact"
                    type="tel"
                    value={formData.altContact || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.altContact && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.altContact}
                    </div>
                  )}

                  <MDBInput
                    wrapperClass={`mb-4 ${getGroupClass("populationServed")}`}
                    placeholder="Population Served"
                    name="populationServed"
                    type="number"
                    value={formData.populationServed || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                  {errors.populationServed && (
                    <div className="invalid-feedback d-block" style={{ 
                      fontSize: "0.875em", 
                      color: "#dc3545", 
                      marginTop: "-1rem",
                      marginBottom: "1rem"
                    }}>
                      {errors.populationServed}
                    </div>
                  )}

                  <MDBInput
                    wrapperClass="mb-4"
                    placeholder="Storage Capacity (optional)"
                    name="storageCapacity"
                    value={formData.storageCapacity || ""}
                    onChange={handleChange}
                    style={{ 
                      marginBottom: "1.5rem",
                      fontSize: "1.1rem"
                    }}
                  />
                </>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ 
            padding: "30px 50px",
            minHeight: "450px"
          }}>
            <h4 className="mb-4" style={{ 
              color: "#2c3e50", 
              fontWeight: "600",
              fontSize: "1.4rem",
              textAlign: "center",
              marginBottom: "2rem"
            }}>
              Step 4: Final Details
            </h4>
            
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <div className={`mb-4 ${getGroupClass("communication")}`} style={{ marginBottom: "1.5rem" }}>
                <label htmlFor="communication" style={{ 
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  marginBottom: "0.5rem",
                  display: "block"
                }}>
                  Preferred Communication Method *
                </label>
                <select
                  id="communication"
                  name="communication"
                  value={formData.communication || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-control ${errors.communication ? "is-invalid" : ""}`}
                  style={{ 
                    padding: "12px 16px", 
                    width: "100%",
                    fontSize: "1.1rem",
                    borderRadius: "8px",
                    border: "1px solid #ced4da",
                    minHeight: "48px",
                    lineHeight: "1.5",
                    backgroundColor: "#fff",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 12px center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "16px",
                    paddingRight: "40px"
                  }}
                >
                  <option value="" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Select an option</option>
                  <option value="SMS" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>SMS</option>
                  <option value="WhatsApp" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>WhatsApp</option>
                  <option value="Call" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Call</option>
                  <option value="Email" style={{ padding: "8px", fontSize: "1.1rem", minHeight: "40px" }}>Email</option>
                </select>
                {errors.communication && (
                  <div className="invalid-feedback d-block" style={{ 
                    fontSize: "0.875em", 
                    color: "#dc3545",
                    marginTop: "0.5rem"
                  }}>
                    {errors.communication}
                  </div>
                )}
              </div>

              <MDBInput
                wrapperClass="mb-4"
                placeholder="Nearest Landmark (optional)"
                name="landmark"
                value={formData.landmark || ""}
                onChange={handleChange}
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("password")}`}
                placeholder="Password *"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.password && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.password}
                </div>
              )}

              <MDBInput
                wrapperClass={`mb-4 ${getGroupClass("confirmPassword")}`}
                placeholder="Confirm Password *"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ 
                  marginBottom: "1.5rem",
                  fontSize: "1.1rem"
                }}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block" style={{ 
                  fontSize: "0.875em", 
                  color: "#dc3545", 
                  marginTop: "-1rem",
                  marginBottom: "1rem"
                }}>
                  {errors.confirmPassword}
                </div>
              )}

              <div className="d-flex justify-content-center" style={{ marginTop: "2rem" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  cursor: "pointer",
                  fontSize: "1.1rem"
                }}>
                  <MDBCheckbox
                    name="subscribe"
                    id="subscribe"
                    checked={formData.subscribe || false}
                    onChange={handleCheckboxChange}
                  />
                  <span style={{ marginLeft: "12px" }}>Subscribe to our newsletter</span>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MDBContainer fluid className="p-0" style={{ backgroundColor: "#f5f6fa" }}>
      {/* Add CSS for spinner animation and aggressive button stability */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Aggressive MDB button override with !important */
          .btn, .MDBBtn, button, 
          .btn-primary, .btn-outline-primary, .btn-success,
          .btn:hover, .btn:focus, .btn:active, .btn:visited,
          .MDBBtn:hover, .MDBBtn:focus, .MDBBtn:active, .MDBBtn:visited,
          button:hover, button:focus, button:active, button:visited {
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            outline: none !important;
            box-sizing: border-box !important;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            min-width: unset !important;
            max-width: unset !important;
          }
          
          /* Force fixed dimensions on navigation buttons */
          .navigation-btn-back {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            border-radius: 8px !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
          }
          
          .navigation-btn-next {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            border-radius: 8px !important;
            background-color: #2196f3 !important;
            border: none !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
          }
          
          .navigation-btn-submit {
            width: 160px !important;
            min-width: 160px !important;
            max-width: 160px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            border-radius: 8px !important;
            background-color: #4caf50 !important;
            border: none !important;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
          }
          
          /* Override all possible MDB button states */
          .navigation-btn-back:hover, .navigation-btn-back:focus, .navigation-btn-back:active,
          .navigation-btn-next:hover, .navigation-btn-next:focus, .navigation-btn-next:active,
          .navigation-btn-submit:hover, .navigation-btn-submit:focus, .navigation-btn-submit:active {
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          
          /* Custom back button - completely stable */
          .custom-back-button {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            border-radius: 8px !important;
            background-color: #6c757d !important;
            border: 2px solid #6c757d !important;
            color: white !important;
            cursor: pointer !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            flex-shrink: 0 !important;
            outline: none !important;
          }
          
          .custom-back-button:hover,
          .custom-back-button:focus,
          .custom-back-button:active,
          .custom-back-button:visited {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            background-color: #6c757d !important;
            border: 2px solid #6c757d !important;
            color: white !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            outline: none !important;
            box-shadow: none !important;
          }

          /* Custom next button - blue background */
          .custom-next-button {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            border-radius: 8px !important;
            background-color: #2196f3 !important;
            border: 2px solid #2196f3 !important;
            color: white !important;
            cursor: pointer !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            flex-shrink: 0 !important;
            outline: none !important;
          }
          
          .custom-next-button:hover,
          .custom-next-button:focus,
          .custom-next-button:active,
          .custom-next-button:visited,
          .custom-next-button:disabled {
            width: 120px !important;
            min-width: 120px !important;
            max-width: 120px !important;
            padding: 12px 24px !important;
            background-color: #2196f3 !important;
            border: 2px solid #2196f3 !important;
            color: white !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            outline: none !important;
            box-shadow: none !important;
            opacity: 1 !important;
          }

          .custom-next-button:disabled {
            background-color: #ccc !important;
            border: 2px solid #ccc !important;
            cursor: not-allowed !important;
          }

          /* Custom submit button - green background */
          .custom-submit-button {
            width: 160px !important;
            min-width: 160px !important;
            max-width: 160px !important;
            padding: 12px 24px !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            border-radius: 8px !important;
            background-color: #4caf50 !important;
            border: 2px solid #4caf50 !important;
            color: white !important;
            cursor: pointer !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            flex-shrink: 0 !important;
            outline: none !important;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
          }
          
          .custom-submit-button:hover,
          .custom-submit-button:focus,
          .custom-submit-button:active,
          .custom-submit-button:visited,
          .custom-submit-button:disabled {
            width: 160px !important;
            min-width: 160px !important;
            max-width: 160px !important;
            padding: 12px 24px !important;
            background-color: #4caf50 !important;
            border: 2px solid #4caf50 !important;
            color: white !important;
            transition: none !important;
            animation: none !important;
            transform: none !important;
            box-sizing: border-box !important;
            outline: none !important;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
            opacity: 1 !important;
          }

          .custom-submit-button:disabled {
            background-color: #ccc !important;
            border: 2px solid #ccc !important;
            cursor: not-allowed !important;
            box-shadow: none !important;
          }
        `}
      </style>
      
      {/* Background Image */}
      <div
        className="bg-image"
        style={{
          backgroundImage: "url('/img/waterbg.jpg')",
          height: "100vh",
          width: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      ></div>

      {/* Centered card */}
      <div className="d-flex justify-content-center" style={{ marginTop: "-850px" }}>
        <MDBCard
          className="shadow-5 w-100"
          style={{
            maxWidth: "750px",
            borderRadius: "20px",
            background: "hsla(0, 0%, 100%, 0.97)",
            backdropFilter: "blur(30px)",
            margin: "auto",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
          }}
        >
          <MDBCardBody className="p-0">
            <div style={{ padding: "40px 30px 20px" }}>
              <h2 className="fw-bold text-center" style={{
                fontSize: "2rem",
                color: "#2c3e50",
                marginBottom: "2rem"
              }}>
                Sign up now
              </h2>

              {/* Progress Bar */}
              <div style={{ padding: "0 30px", marginBottom: "1rem" }}>
                <MDBProgress 
                  className="mb-3" 
                  style={{ 
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: "#e9ecef"
                  }}
                >
                  <MDBProgressBar 
                    width={(currentStep / totalSteps) * 100} 
                    style={{
                      backgroundColor: "#2196f3",
                      borderRadius: "4px",
                      transition: "width 0.3s ease"
                    }}
                  />
                </MDBProgress>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {renderStep()}

              {/* Navigation Buttons */}
              <div style={{ 
                padding: "30px 50px 20px",
                borderTop: "1px solid #e9ecef",
                marginTop: "2rem"
              }}>
                <div style={{ 
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  alignItems: "center",
                  gap: "20px"
                }}>
                  {/* Left: Back Button */}
                  <div style={{ justifySelf: "start" }}>
                    {currentStep > 1 ? (
                      <button 
                        type="button" 
                        onClick={handleBack}
                        className="custom-back-button"
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.preventDefault()}
                      >
                        ← Back
                      </button>
                    ) : (
                      <div></div>
                    )}
                  </div>
                  
                  {/* Center: Step Indicator */}
                  <div style={{ 
                    justifySelf: "center",
                    fontSize: "1.1rem", 
                    color: "#6c757d",
                    fontWeight: "500",
                    textAlign: "center"
                  }}>
                    Step {currentStep} of {totalSteps}
                  </div>
                  
                  {/* Right: Next/Submit Button */}
                  <div style={{ justifySelf: "end" }}>
                    {currentStep < totalSteps ? (
                      <button 
                        type="button" 
                        onClick={handleNext}
                        disabled={hasCurrentStepErrors()}
                        className="custom-next-button"
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.preventDefault()}
                      >
                        Next →
                      </button>
                    ) : (
                      <button 
                        type="submit"
                        disabled={!isFormValidForSubmission() || isSubmitting}
                        className="custom-submit-button"
                        onMouseDown={(e) => e.preventDefault()}
                        onFocus={(e) => e.preventDefault()}
                      >
                        {isSubmitting ? (
                          <>
                            <span 
                              style={{
                                display: "inline-block",
                                width: "16px",
                                height: "16px",
                                border: "2px solid #ffffff",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                marginRight: "8px"
                              }}
                            ></span>
                            Signing up...
                          </>
                        ) : (
                          "Complete Signup"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </MDBCardBody>
        </MDBCard>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: "white",
              borderRadius: "15px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "80vh",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: "25px 30px",
              borderBottom: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ 
                margin: 0, 
                color: "#2c3e50",
                fontSize: "1.5rem",
                fontWeight: "600"
              }}>
                Confirm Your Registration
              </h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6c757d",
                  padding: "5px"
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ 
              padding: "25px 30px",
              maxHeight: "50vh", 
              overflowY: "auto" 
            }}>
              <h5 style={{ 
                color: "#2c3e50", 
                marginBottom: "1.5rem",
                fontSize: "1.3rem",
                fontWeight: "600"
              }}>
                Please review your information:
              </h5>
              
              {/* Account Type */}
              <div style={{ 
                marginBottom: "1.5rem", 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px" 
              }}>
                <h6 style={{ 
                  color: "#495057", 
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Account Type
                </h6>
                <p style={{ 
                  margin: "0", 
                  textTransform: "capitalize",
                  fontSize: "1.05rem"
                }}>
                  {formData.accountType}
                </p>
              </div>

              {/* Personal Information */}
              <div style={{ 
                marginBottom: "1.5rem", 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px" 
              }}>
                <h6 style={{ 
                  color: "#495057", 
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Personal Information
                </h6>
                {formData.accountType === "household" ? (
                  <>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Name:</strong> {formData.firstName} {formData.lastName}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Phone:</strong> {formatPhoneForDisplay(formData.phone)}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Alternative Phone:</strong> {formatPhoneForDisplay(formData.altPhone || "")}
                    </p>
                    {formData.email && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Email:</strong> {formData.email}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Institution:</strong> {formData.institutionName}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Type:</strong> {formData.institutionType}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Contact Person:</strong> {formData.contactPerson}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Phone:</strong> {formatPhoneForDisplay(formData.phone)}
                    </p>
                    {formData.altContact && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Alternative Contact:</strong> {formatPhoneForDisplay(formData.altContact || "")}
                      </p>
                    )}
                    {formData.email && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Email:</strong> {formData.email}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Account Details */}
              <div style={{ 
                marginBottom: "1.5rem", 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px" 
              }}>
                <h6 style={{ 
                  color: "#495057", 
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Account Details
                </h6>
                {formData.accountType === "household" ? (
                  <>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Plot Number:</strong> {formData.plotNumber}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Household Size:</strong> {formData.householdSize}
                    </p>
                    <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                      <strong>Village/Location:</strong> {formData.village}
                    </p>
                  </>
                ) : (
                  <>
                    {formData.plotNumber && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Plot Number:</strong> {formData.plotNumber}
                      </p>
                    )}
                    {formData.populationServed && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Population Served:</strong> {formData.populationServed}
                      </p>
                    )}
                    {formData.storageCapacity && (
                      <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                        <strong>Storage Capacity:</strong> {formData.storageCapacity}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Communication & Other */}
              <div style={{ 
                marginBottom: "1.5rem", 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px" 
              }}>
                <h6 style={{ 
                  color: "#495057", 
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Communication & Other
                </h6>
                <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                  <strong>Preferred Communication:</strong> {formData.communication}
                </p>
                {formData.landmark && (
                  <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                    <strong>Nearest Landmark:</strong> {formData.landmark}
                  </p>
                )}
                <p style={{ margin: "0.25rem 0", fontSize: "1.05rem" }}>
                  <strong>Newsletter Subscription:</strong> {formData.subscribe ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "20px 30px",
              borderTop: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "flex-end",
              gap: "15px"
            }}>
              <button 
                onClick={handleEditForm}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                Edit Information
              </button>
              <button 
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isSubmitting ? "#ccc" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  fontWeight: "600",
                  minWidth: "140px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {isSubmitting ? (
                  <>
                    <span 
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid #fff",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                      }}
                    ></span>
                    Saving...
                  </>
                ) : (
                  "Save & Complete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MDBContainer>
  );
};

export default Signup;