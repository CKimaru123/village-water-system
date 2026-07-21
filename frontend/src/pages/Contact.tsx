import React, { useState, ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";

// 🔹 Type definitions
interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  submit?: string;
}

interface ContactData {
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
}

interface ContactProps {
  data?: ContactData;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  senderName: string;
}

// 🔹 Initial state
const initialState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

// 🔹 Success Modal Component
const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, senderName }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="modal-content" 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          position: 'relative',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#28a745',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'checkmarkBounce 0.6s ease-out'
        }}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </div>

        {/* Success Message */}
        <h2 style={{
          color: '#333',
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '15px',
          fontFamily: 'Arial, sans-serif'
        }}>
          {t("Message Sent Successfully!")}
        </h2>

        <p style={{
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.5',
          marginBottom: '20px',
          fontFamily: 'Arial, sans-serif'
        }}>
          Thank you, <strong>{senderName}</strong>! {message}
        </p>

        <p style={{
          color: '#888',
          fontSize: '14px',
          marginBottom: '25px',
          fontFamily: 'Arial, sans-serif'
        }}>
          We'll get back to you as soon as possible.
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 30px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: 'Arial, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {t("Continue")}
        </button>

        {/* Close X Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#999',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#999';
          }}
        >
          ×
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes checkmarkBounce {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export const Contact: React.FC<ContactProps> = ({ data }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (name.trim().length > 100) return "Name must be less than 100 characters";
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return "Name must contain only letters, spaces, hyphens, and apostrophes";
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid email address";
    if (email.trim().length > 255) return "Email must be less than 255 characters";
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return undefined; // Phone is optional
    
    // Remove all non-digits for validation
    const cleaned = phone.replace(/\D/g, '');
    
    // Check various Kenyan phone number formats
    if (!/^(254[7]\d{8}|0[7]\d{8}|[7]\d{8})$/.test(cleaned)) {
      return "Please enter a valid Kenyan phone number (e.g., +254712345678, 0712345678, or 712345678)";
    }
    return undefined;
  };

  const validateSubject = (subject: string): string | undefined => {
    if (!subject.trim()) return "Subject is required";
    if (subject.trim().length < 5) return "Subject must be at least 5 characters";
    if (subject.trim().length > 200) return "Subject must be less than 200 characters";
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message.trim()) return "Message is required";
    if (message.trim().length < 10) return "Message must be at least 10 characters";
    if (message.trim().length > 2000) return "Message must be less than 2000 characters";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};
    
    newErrors.name = validateName(formData.name);
    newErrors.email = validateEmail(formData.email);
    newErrors.phone = validatePhone(formData.phone);
    newErrors.subject = validateSubject(formData.subject);
    newErrors.message = validateMessage(formData.message);

    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key as keyof ContactFormErrors] === undefined) {
        delete newErrors[key as keyof ContactFormErrors];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof ContactFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear submit error
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }
  };

  const clearState = () => {
    setFormData({ ...initialState });
    setErrors({});
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
    // Form stays cleared after successful submission
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3001/api/v1';
      const response = await fetch(`${BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            subject: formData.subject.trim(),
            message: formData.message.trim()
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage(data.data.message || 'Thank you for your message! We will get back to you soon.');
        clearState(); // Clear the form
        setShowSuccessModal(true); // Show success modal
      } else {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          setErrors({ submit: data.errors.join(', ') });
        } else {
          setErrors({ submit: data.message || 'Failed to submit contact form. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      setErrors({ 
        submit: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div id="contact">
        <div className="container">
          {/* Contact Form and Info Section */}
          <div className="row" style={{ marginBottom: '40px' }}>
            <div className="col-md-8">
              <div className="section-title">
                <h2>{t("Get In Touch")}</h2>
                <p>
                  {t("ContactFormDescription")}
                </p>
              </div>
              
              <form name="sentMessage" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={`form-control ${errors.name ? 'error' : ''}`}
                        placeholder={t("Full Name *")}
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <div className="error-message" style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                          {errors.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={`form-control ${errors.email ? 'error' : ''}`}
                        placeholder={t("Email Address *")}
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <div className="error-message" style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className={`form-control ${errors.phone ? 'error' : ''}`}
                        placeholder={t("Phone Number (Optional)")}
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <div className="error-message" style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                          {errors.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        className={`form-control ${errors.subject ? 'error' : ''}`}
                        placeholder={t("Subject *")}
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      {errors.subject && (
                        <div className="error-message" style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                          {errors.subject}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <textarea
                    name="message"
                    id="message"
                    className={`form-control ${errors.message ? 'error' : ''}`}
                    rows={6}
                    placeholder={t("Your Message *")}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  ></textarea>
                  {errors.message && (
                    <div className="error-message" style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                      {errors.message}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#4209e0ff', marginTop: '5px' }}>
                    {formData.message.length}/2000 characters
                  </div>
                </div>

                {errors.submit && (
                  <div className="alert alert-danger" style={{
                    backgroundColor: '#f8d7da',
                    borderColor: '#f5c6cb',
                    color: '#721c24',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '15px'
                  }}>
                    {errors.submit}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-custom btn-lg"
                  disabled={isSubmitting}
                  style={{
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? t("Sending...") : t("Send Message")}
                </button>
              </form>
            </div>
            
            {/* Contact Info */}
            <div className="col-md-4 contact-info">
              <div className="contact-item">
                <h3>{t("Contact Info")}</h3>
                <p>
                  <span>
                    <i className="fa fa-map-marker"></i> {t("Address")}
                  </span>
                  {data?.address ?? t("Default Address")}
                </p>
              </div>
              <div className="contact-item">
                <p>
                  <span>
                    <i className="fa fa-phone"></i> {t("Phone")}
                  </span>{" "}
                  {data?.phone ?? "+254 712 345 678"}
                </p>
              </div>
              <div className="contact-item">
                <p>
                  <span>
                    <i className="fa fa-envelope-o"></i> {t("Email")}
                  </span>{" "}
                  {data?.email ?? "info@burguretwater.com"}
                </p>
              </div>
              <div className="contact-item">
                <p>
                  <span>
                    <i className="fa fa-clock-o"></i> {t("Office Hours")}
                  </span>
                  {t("Office Hours Detail")}
                </p>
              </div>
            </div>
          </div>

          {/* Full Width Map Section */}
          <div className="row">
            <div className="col-md-12">
              <div className="section-title" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2>{t("Find Us")}</h2>
                <p>{t("Find Us Description")}</p>
              </div>
              <div className="map-container" style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
                background: '#f8f9fa',
                padding: '4px'
              }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8034!2d37.03029108569131!3d-0.076991550749574!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMDQnMzcuMiJTIDM3wrAwMSc0OS4wIkU!5e0!3m2!1sen!2ske!4v1758224648680!5m2!1sen!2ske"
                  width="100%"
                  height="500"
                  style={{ 
                    border: 0,
                    borderRadius: '12px',
                    transition: 'transform 0.3s ease',
                    display: 'block'
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Interactive Location Map"
                  onMouseEnter={(e) => {
                    (e.target as HTMLIFrameElement).style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLIFrameElement).style.transform = 'scale(1)';
                  }}
                ></iframe>
                
                {/* Map overlay with instructions */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#333',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <i className="fa fa-info-circle" style={{ marginRight: '8px' }}></i>
                  {t("Use mouse wheel to zoom")}
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="row" style={{ marginTop: '40px' }}>
            <div className="col-md-12">
              <div className="social">
                <ul>
                  <li>
                    <a href={data?.facebook ?? "/"}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                  <li>
                    <a href={data?.twitter ?? "/"}>
                      <i className="fa fa-twitter"></i>
                    </a>
                  </li>
                  <li>
                    <a href={data?.youtube ?? "/"}>
                      <i className="fa fa-youtube"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        message={successMessage}
        senderName={formData.name || t("User")}
      />

      <div id="footer">
        <div className="container text-center">
          <p>
            &copy; 2025. {t("Design by")} {" "}
            <a href="https://ckimaru23.github.io/Updated-Portfolio/" rel="nofollow">
              {t("Collins Kiragu")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
