import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Layout from "../../components/Layout/Layout";
import { ChevronRight, ChevronLeft, Check, AlertCircle, Loader } from "lucide-react";
import {
  saveDraftApplication,
  submitApplication,
  getActiveSubscriptionPlans,
  getMyApplication,
} from "../../services/sellerApi";
import "./sellerWizard.css";

const SellerWizardV2 = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [plans, setPlans] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const [formData, setFormData] = useState({
    selectedPlanId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    identityProofType: "aadhar",
    identityProofNumber: "",
    identityProofImage: null,
    addressProofType: "aadhar",
    addressProofImage: null,
    businessName: "",
    businessType: "sole_proprietor",
    gstNumber: "",
    gstImage: null,
    panNumber: "",
    panImage: null,
    businessDescription: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "savings",
    ifscCode: "",
    bankName: "",
    cancelledCheckImage: null,
    termsAccepted: false,
    privacyAccepted: false,
    communicationConsent: false,
  });

  // Fetch plans and check existing application
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch active plans
        const plansRes = await getActiveSubscriptionPlans();
        if (plansRes.success) {
          setPlans(plansRes.plans || []);
        }

        // Check if user has existing application
        if (auth?.token) {
          try {
            const appRes = await getMyApplication(auth.token);
            if (appRes.success && appRes.application) {
              const app = appRes.application;
              setApplicationId(app._id);

              // If application is submitted/under_review/approved_pending_payment, lock plan
              if (
                ["submitted", "under_review", "approved_pending_payment"].includes(
                  app.status
                )
              ) {
                setIsLocked(true);
              }

              // If rejected, allow reapply
              if (app.status === "rejected") {
                setFormData((prev) => ({
                  ...prev,
                  selectedPlanId: app.selectedPlan?._id || "",
                }));
              }
            }
          } catch (err) {
            // No existing application, continue
          }
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load plans");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [auth?.token]);

  // Handle plan selection
  const handlePlanSelect = (planId) => {
    if (isLocked) {
      setError("Plan is locked. You cannot change it until your application is resolved.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      selectedPlanId: planId,
    }));
    setCurrentStep(1);
  };

  // Handle form input change with validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    // Numeric field validation
    if (name === "phone" || name === "pincode" || name === "accountNumber") {
      finalValue = value.replace(/[^0-9]/g, "");
    }

    // Phone: max 10 digits
    if (name === "phone") {
      finalValue = finalValue.slice(0, 10);
    }

    // Pincode: max 6 digits
    if (name === "pincode") {
      finalValue = finalValue.slice(0, 6);
    }

    // IFSC Code: uppercase, alphanumeric only, max 11 chars
    if (name === "ifscCode") {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    }

    // GST Number: uppercase, alphanumeric only, max 15 chars
    if (name === "gstNumber") {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    }

    // PAN Number: uppercase, alphanumeric only, max 10 chars
    if (name === "panNumber") {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : finalValue,
    }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError("");

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] instanceof File) {
          formDataToSend.append(key, formData[key]);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await saveDraftApplication(formDataToSend, auth?.token);

      if (response.success) {
        setApplicationId(response.applicationId);
        setSuccess("Draft saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to save draft");
      setLoading(false);
    }
  };

  // Submit application
  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.selectedPlanId) {
        setError("Please select a plan");
        return;
      }

      if (!formData.termsAccepted || !formData.privacyAccepted) {
        setError("Please accept terms and privacy policy");
        return;
      }

      setLoading(true);
      setError("");

      // First save draft if not saved
      if (!applicationId) {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key] instanceof File) {
            formDataToSend.append(key, formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        });

        const draftRes = await saveDraftApplication(
          formDataToSend,
          auth?.token
        );
        if (!draftRes.success) throw new Error("Failed to save draft");
        setApplicationId(draftRes.applicationId);
      }

      // Submit application
      const submitRes = await submitApplication(applicationId, auth?.token);

      if (submitRes.success) {
        setSuccess("Application submitted successfully!");
        setIsLocked(true);
        setTimeout(() => {
          navigate("/seller/status");
        }, 2000);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to submit application");
      setLoading(false);
    }
  };

  // Step 0: Plan Selection
  const renderPlanSelection = () => (
    <div className="wizard-step">
      <h2 className="step-title">Select Your Plan</h2>
      <p className="step-subtitle">Choose a subscription plan to get started</p>

      {isLocked && (
        <div className="alert alert-warning mb-4">
          <AlertCircle size={20} />
          <span>Your plan is locked. You cannot change it until your application is resolved.</span>
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`plan-card ${
              formData.selectedPlanId === plan._id ? "selected" : ""
            } ${isLocked ? "disabled" : ""}`}
            onClick={() => !isLocked && handlePlanSelect(plan._id)}
          >
            <div className="plan-header">
              <h3>{plan.name}</h3>
              {plan.isFree && <span className="badge badge-free">Free</span>}
            </div>

            <div className="plan-price">
              {plan.isFree ? (
                <span>Free</span>
              ) : (
                <>
                  <span className="currency">₹</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">/{plan.billingCycle}</span>
                </>
              )}
            </div>

            <p className="plan-description">{plan.description}</p>

            <ul className="plan-features">
              {plan.includedCapabilities?.slice(0, 5).map((cap, idx) => (
                <li key={idx}>
                  <Check size={16} />
                  <span>{cap}</span>
                </li>
              ))}
              {plan.includedCapabilities?.length > 5 && (
                <li>
                  <span>+{plan.includedCapabilities.length - 5} more features</span>
                </li>
              )}
            </ul>

            <button
              className={`btn btn-primary w-100 ${
                formData.selectedPlanId === plan._id ? "selected" : ""
              }`}
              disabled={isLocked}
            >
              {formData.selectedPlanId === plan._id ? "Selected" : "Select Plan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Steps 1-6: Form Fields
  const renderFormStep = () => {
    const steps = [
      {
        title: "Personal Information",
        fields: ["firstName", "lastName", "email", "phone"],
      },
      {
        title: "Address Information",
        fields: ["addressLine1", "addressLine2", "city", "state", "pincode"],
      },
      {
        title: "Identity Verification",
        fields: [
          "identityProofType",
          "identityProofNumber",
          "identityProofImage",
        ],
      },
      {
        title: "Business Information",
        fields: [
          "businessName",
          "businessType",
          "businessDescription",
          "gstNumber",
          "gstImage",
          "panNumber",
          "panImage",
        ],
      },
      {
        title: "Banking Information",
        fields: [
          "accountHolderName",
          "accountNumber",
          "accountType",
          "ifscCode",
          "bankName",
          "cancelledCheckImage",
        ],
      },
      {
        title: "Consents & Agreements",
        fields: ["termsAccepted", "privacyAccepted", "communicationConsent"],
      },
    ];

    const step = steps[currentStep - 1];

    return (
      <div className="wizard-step">
        <h2 className="step-title">{step.title}</h2>

        <div className="form-group">
          {step.fields.map((field) => (
            <div key={field} className="mb-3">
              {renderFormField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render individual form field
  const renderFormField = (fieldName) => {
    const fieldLabels = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      addressLine1: "Address Line 1",
      addressLine2: "Address Line 2",
      city: "City",
      state: "State",
      pincode: "Pincode",
      identityProofType: "Identity Proof Type",
      identityProofNumber: "Identity Proof Number",
      identityProofImage: "Identity Proof Image",
      addressProofType: "Address Proof Type",
      addressProofNumber: "Address Proof Number",
      addressProofImage: "Address Proof Image",
      businessName: "Business Name",
      businessType: "Business Type",
      businessDescription: "Business Description",
      gstNumber: "GST Number",
      gstImage: "GST Certificate",
      panNumber: "PAN Number",
      panImage: "PAN Image",
      accountHolderName: "Account Holder Name",
      accountNumber: "Account Number",
      accountType: "Account Type",
      ifscCode: "IFSC Code",
      bankName: "Bank Name",
      cancelledCheckImage: "Cancelled Cheque",
      termsAccepted: "I accept Terms & Conditions",
      privacyAccepted: "I accept Privacy Policy",
      communicationConsent: "I consent to marketing communications",
    };

    const selectOptions = {
      identityProofType: ["aadhar", "pan", "passport", "driving_license"],
      addressProofType: ["aadhar", "passport", "utility_bill", "lease_agreement"],
      businessType: ["sole_proprietor", "partnership", "pvt_ltd", "llp", "ngo"],
      accountType: ["savings", "current"],
    };

    const label = fieldLabels[fieldName];

    // Checkbox fields
    if (
      ["termsAccepted", "privacyAccepted", "communicationConsent"].includes(
        fieldName
      )
    ) {
      return (
        <label className="form-check">
          <input
            type="checkbox"
            name={fieldName}
            checked={formData[fieldName]}
            onChange={handleInputChange}
            className="form-check-input"
          />
          <span className="form-check-label">{label}</span>
        </label>
      );
    }

    // File input fields
    if (
      [
        "identityProofImage",
        "addressProofImage",
        "gstImage",
        "panImage",
        "cancelledCheckImage",
      ].includes(fieldName)
    ) {
      return (
        <>
          <label className="form-label">{label}</label>
          <input
            type="file"
            name={fieldName}
            onChange={handleFileChange}
            className="form-control"
            accept="image/*,.pdf"
          />
        </>
      );
    }

    // Select fields
    if (selectOptions[fieldName]) {
      return (
        <>
          <label className="form-label">{label}</label>
          <select
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleInputChange}
            className="form-control"
          >
            <option value="">Select {label}</option>
            {selectOptions[fieldName].map((option) => (
              <option key={option} value={option}>
                {option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </>
      );
    }

    // Text input fields with specific types and validation
    const getInputType = (fieldName) => {
      if (fieldName === "email") return "email";
      if (fieldName === "phone") return "tel";
      if (fieldName === "pincode") return "text";
      return "text";
    };

    const getInputPattern = (fieldName) => {
      if (fieldName === "phone") return "[0-9]{10}";
      if (fieldName === "pincode") return "[0-9]{6}";
      if (fieldName === "accountNumber") return "[0-9]+";
      if (fieldName === "ifscCode") return "[A-Z0-9]{11}";
      if (fieldName === "gstNumber") return "[0-9A-Z]{15}";
      if (fieldName === "panNumber") return "[A-Z]{5}[0-9]{4}[A-Z]{1}";
      return null;
    };

    const getInputPlaceholder = (fieldName) => {
      if (fieldName === "phone") return "10-digit mobile number";
      if (fieldName === "pincode") return "6-digit pincode";
      if (fieldName === "accountNumber") return "Enter account number";
      if (fieldName === "ifscCode") return "11-character IFSC code";
      if (fieldName === "gstNumber") return "15-character GST number";
      if (fieldName === "panNumber") return "10-character PAN number";
      return label;
    };

    const inputType = getInputType(fieldName);
    const pattern = getInputPattern(fieldName);
    const placeholder = getInputPlaceholder(fieldName);

    return (
      <>
        <label className="form-label">{label}</label>
        <input
          type={inputType}
          name={fieldName}
          value={formData[fieldName]}
          onChange={handleInputChange}
          className="form-control"
          placeholder={placeholder}
          pattern={pattern}
          title={
            fieldName === "phone" ? "Please enter a valid 10-digit phone number" :
            fieldName === "pincode" ? "Please enter a valid 6-digit pincode" :
            fieldName === "accountNumber" ? "Please enter only numbers" :
            fieldName === "ifscCode" ? "Please enter a valid 11-character IFSC code" :
            fieldName === "gstNumber" ? "Please enter a valid 15-character GST number" :
            fieldName === "panNumber" ? "Please enter a valid 10-character PAN number" :
            ""
          }
          maxLength={
            fieldName === "phone" ? 10 :
            fieldName === "pincode" ? 6 :
            fieldName === "ifscCode" ? 11 :
            fieldName === "gstNumber" ? 15 :
            fieldName === "panNumber" ? 10 :
            undefined
          }
        />
      </>
    );
  };

  // Progress bar
  const renderProgress = () => (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
        />
      </div>
      <p className="progress-text">
        Step {currentStep + 1} of 7
      </p>
    </div>
  );

  if (loading && currentStep === 0) {
    return (
      <Layout>
        <div className="container mt-5">
          <div className="text-center">
            <Loader className="spinner" />
            <p>Loading plans...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-5 mb-5">
        <div className="wizard-container">
          {renderProgress()}

          {error && (
            <div className="alert alert-danger mb-4">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <Check size={20} />
              <span>{success}</span>
            </div>
          )}

          {currentStep === 0 ? renderPlanSelection() : renderFormStep()}

          <div className="wizard-actions">
            {currentStep > 0 && (
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}

            {currentStep > 0 && currentStep < 6 && (
              <>
                <button
                  className="btn btn-outline"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  Save Draft
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={loading}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {currentStep === 6 && (
              <>
                <button
                  className="btn btn-outline"
                  onClick={handleSaveDraft}
                  disabled={loading}
                >
                  Save Draft
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="spinner-small" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Submit Application
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {isLocked && (
            <div className="alert alert-info mt-4">
              <AlertCircle size={20} />
              <span>
                Your application is under review. Plan changes are locked.
              </span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerWizardV2;
