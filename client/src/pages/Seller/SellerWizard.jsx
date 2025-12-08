import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth";
import Layout from "../../components/Layout/Layout";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import "./sellerWizard.css";

const SellerWizard = () => {
  const navigate = useNavigate();
  const [auth] = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
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
    addressProofNumber: "",
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!auth?.user) {
      navigate("/login");
      return;
    }
    fetchPlans();
  }, [auth, navigate]);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get("/api/v1/subscription-plans/active");
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Plan Selection
        if (!selectedPlan) {
          newErrors.plan = "Please select a subscription plan";
        }
        break;

      case 1: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        break;

      case 2: // Address
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
        break;

      case 3: // KYC
        if (!formData.identityProofNumber.trim())
          newErrors.identityProofNumber = "ID number is required";
        if (!formData.identityProofImage)
          newErrors.identityProofImage = "ID image is required";
        if (!formData.addressProofNumber.trim())
          newErrors.addressProofNumber = "Address proof number is required";
        if (!formData.addressProofImage)
          newErrors.addressProofImage = "Address proof image is required";
        break;

      case 4: // Business
        if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
        if (!formData.gstNumber.trim()) newErrors.gstNumber = "GST number is required";
        if (!formData.gstImage) newErrors.gstImage = "GST image is required";
        if (!formData.panNumber.trim()) newErrors.panNumber = "PAN number is required";
        if (!formData.panImage) newErrors.panImage = "PAN image is required";
        break;

      case 5: // Banking
        if (!formData.accountHolderName.trim())
          newErrors.accountHolderName = "Account holder name is required";
        if (!formData.accountNumber.trim())
          newErrors.accountNumber = "Account number is required";
        if (!formData.ifscCode.trim()) newErrors.ifscCode = "IFSC code is required";
        if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
        if (!formData.cancelledCheckImage)
          newErrors.cancelledCheckImage = "Cancelled cheque image is required";
        break;

      case 6: // Consents
        if (!formData.termsAccepted) newErrors.termsAccepted = "You must accept terms";
        if (!formData.privacyAccepted) newErrors.privacyAccepted = "You must accept privacy policy";
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 0) {
        setFormData((prev) => ({
          ...prev,
          selectedPlanId: selectedPlan._id,
        }));
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] instanceof File) {
          submitData.append(key, formData[key]);
        } else if (typeof formData[key] === "boolean") {
          submitData.append(key, formData[key] ? "true" : "false");
        } else {
          submitData.append(key, formData[key]);
        }
      });

      const { data } = await axios.post(
        "/api/v1/sellers/applications/submit",
        submitData,
        {
          headers: {
            Authorization: auth?.token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        alert("Application submitted successfully! We will review it soon.");
        navigate("/seller/dashboard");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert(error.response?.data?.message || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Select Plan", icon: "📋" },
    { title: "Personal Info", icon: "👤" },
    { title: "Address", icon: "📍" },
    { title: "KYC Documents", icon: "📄" },
    { title: "Business Info", icon: "🏢" },
    { title: "Banking Info", icon: "🏦" },
    { title: "Consents", icon: "✓" },
    { title: "Review", icon: "👁️" },
  ];

  return (
    <Layout>
      <div className="seller-wizard-container">
        <div className="wizard-header">
          <h1>Become a Seller</h1>
          <p>Complete the steps below to start selling on Smitox</p>
        </div>

        {/* Progress Steps */}
        <div className="wizard-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step ${index === currentStep ? "active" : ""} ${
                index < currentStep ? "completed" : ""
              }`}
            >
              <div className="step-circle">
                {index < currentStep ? <Check size={20} /> : index + 1}
              </div>
              <div className="step-label">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {currentStep === 0 && (
            <StepPlanSelection
              plans={plans}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              errors={errors}
            />
          )}

          {currentStep === 1 && (
            <StepPersonalInfo formData={formData} handleInputChange={handleInputChange} errors={errors} />
          )}

          {currentStep === 2 && (
            <StepAddress formData={formData} handleInputChange={handleInputChange} errors={errors} />
          )}

          {currentStep === 3 && (
            <StepKYC formData={formData} handleInputChange={handleInputChange} handleFileChange={handleFileChange} errors={errors} />
          )}

          {currentStep === 4 && (
            <StepBusiness formData={formData} handleInputChange={handleInputChange} handleFileChange={handleFileChange} errors={errors} />
          )}

          {currentStep === 5 && (
            <StepBanking formData={formData} handleInputChange={handleInputChange} handleFileChange={handleFileChange} errors={errors} />
          )}

          {currentStep === 6 && (
            <StepConsents formData={formData} handleInputChange={handleInputChange} errors={errors} />
          )}

          {currentStep === 7 && (
            <StepReview formData={formData} selectedPlan={selectedPlan} />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="wizard-footer">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={20} /> Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Step Components
const StepPlanSelection = ({ plans, selectedPlan, setSelectedPlan, errors }) => (
  <div className="step-content">
    <h2>Select Your Subscription Plan</h2>
    <p>Choose a plan that best fits your business needs</p>

    <div className="plans-grid">
      {plans.map((plan) => (
        <div
          key={plan._id}
          className={`plan-card ${selectedPlan?._id === plan._id ? "selected" : ""}`}
          onClick={() => setSelectedPlan(plan)}
        >
          <div className="plan-header">
            <h3>{plan.name}</h3>
            {plan.isRecommended && <span className="badge-recommended">Recommended</span>}
          </div>

          <div className="plan-price">
            {plan.isFree ? (
              <span className="free">Free</span>
            ) : (
              <>
                <span className="amount">₹{plan.price}</span>
                <span className="period">/{plan.billingCycle}</span>
              </>
            )}
          </div>

          <p className="plan-description">{plan.description}</p>

          <ul className="plan-features">
            {plan.features?.slice(0, 4).map((feature, idx) => (
              <li key={idx}>
                <Check size={16} /> {feature.name}
              </li>
            ))}
          </ul>

          <div className="plan-selection">
            <input
              type="radio"
              name="plan"
              checked={selectedPlan?._id === plan._id}
              onChange={() => setSelectedPlan(plan)}
            />
            <span>Select Plan</span>
          </div>
        </div>
      ))}
    </div>

    {errors.plan && <div className="error-message">{errors.plan}</div>}
  </div>
);

const StepPersonalInfo = ({ formData, handleInputChange, errors }) => (
  <div className="step-content">
    <h2>Personal Information</h2>

    <div className="form-group">
      <label>First Name *</label>
      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
        className={errors.firstName ? "error" : ""}
      />
      {errors.firstName && <span className="error-text">{errors.firstName}</span>}
    </div>

    <div className="form-group">
      <label>Last Name *</label>
      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
        className={errors.lastName ? "error" : ""}
      />
      {errors.lastName && <span className="error-text">{errors.lastName}</span>}
    </div>

    <div className="form-group">
      <label>Email *</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        className={errors.email ? "error" : ""}
      />
      {errors.email && <span className="error-text">{errors.email}</span>}
    </div>

    <div className="form-group">
      <label>Phone *</label>
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleInputChange}
        className={errors.phone ? "error" : ""}
      />
      {errors.phone && <span className="error-text">{errors.phone}</span>}
    </div>
  </div>
);

const StepAddress = ({ formData, handleInputChange, errors }) => (
  <div className="step-content">
    <h2>Address Information</h2>

    <div className="form-group">
      <label>Address Line 1 *</label>
      <input
        type="text"
        name="addressLine1"
        value={formData.addressLine1}
        onChange={handleInputChange}
        className={errors.addressLine1 ? "error" : ""}
      />
      {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
    </div>

    <div className="form-group">
      <label>Address Line 2</label>
      <input
        type="text"
        name="addressLine2"
        value={formData.addressLine2}
        onChange={handleInputChange}
      />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>City *</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          className={errors.city ? "error" : ""}
        />
        {errors.city && <span className="error-text">{errors.city}</span>}
      </div>

      <div className="form-group">
        <label>State *</label>
        <input
          type="text"
          name="state"
          value={formData.state}
          onChange={handleInputChange}
          className={errors.state ? "error" : ""}
        />
        {errors.state && <span className="error-text">{errors.state}</span>}
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Pincode *</label>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleInputChange}
          className={errors.pincode ? "error" : ""}
        />
        {errors.pincode && <span className="error-text">{errors.pincode}</span>}
      </div>

      <div className="form-group">
        <label>Country</label>
        <input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleInputChange}
          disabled
        />
      </div>
    </div>
  </div>
);

const StepKYC = ({ formData, handleInputChange, handleFileChange, errors }) => (
  <div className="step-content">
    <h2>KYC Documents</h2>

    <div className="form-group">
      <label>Identity Proof Type *</label>
      <select name="identityProofType" value={formData.identityProofType} onChange={handleInputChange}>
        <option value="aadhar">Aadhar</option>
        <option value="pan">PAN</option>
        <option value="passport">Passport</option>
        <option value="driving_license">Driving License</option>
      </select>
    </div>

    <div className="form-group">
      <label>Identity Proof Number *</label>
      <input
        type="text"
        name="identityProofNumber"
        value={formData.identityProofNumber}
        onChange={handleInputChange}
        className={errors.identityProofNumber ? "error" : ""}
      />
      {errors.identityProofNumber && <span className="error-text">{errors.identityProofNumber}</span>}
    </div>

    <div className="form-group">
      <label>Identity Proof Image *</label>
      <input
        type="file"
        name="identityProofImage"
        onChange={handleFileChange}
        accept="image/*"
        className={errors.identityProofImage ? "error" : ""}
      />
      {errors.identityProofImage && <span className="error-text">{errors.identityProofImage}</span>}
    </div>

    <hr />

    <div className="form-group">
      <label>Address Proof Type *</label>
      <select name="addressProofType" value={formData.addressProofType} onChange={handleInputChange}>
        <option value="aadhar">Aadhar</option>
        <option value="passport">Passport</option>
        <option value="utility_bill">Utility Bill</option>
        <option value="lease_agreement">Lease Agreement</option>
      </select>
    </div>

    <div className="form-group">
      <label>Address Proof Number *</label>
      <input
        type="text"
        name="addressProofNumber"
        value={formData.addressProofNumber}
        onChange={handleInputChange}
        className={errors.addressProofNumber ? "error" : ""}
      />
      {errors.addressProofNumber && <span className="error-text">{errors.addressProofNumber}</span>}
    </div>

    <div className="form-group">
      <label>Address Proof Image *</label>
      <input
        type="file"
        name="addressProofImage"
        onChange={handleFileChange}
        accept="image/*"
        className={errors.addressProofImage ? "error" : ""}
      />
      {errors.addressProofImage && <span className="error-text">{errors.addressProofImage}</span>}
    </div>
  </div>
);

const StepBusiness = ({ formData, handleInputChange, handleFileChange, errors }) => (
  <div className="step-content">
    <h2>Business Information</h2>

    <div className="form-group">
      <label>Business Name *</label>
      <input
        type="text"
        name="businessName"
        value={formData.businessName}
        onChange={handleInputChange}
        className={errors.businessName ? "error" : ""}
      />
      {errors.businessName && <span className="error-text">{errors.businessName}</span>}
    </div>

    <div className="form-group">
      <label>Business Type *</label>
      <select name="businessType" value={formData.businessType} onChange={handleInputChange}>
        <option value="sole_proprietor">Sole Proprietor</option>
        <option value="partnership">Partnership</option>
        <option value="pvt_ltd">Private Limited</option>
        <option value="llp">LLP</option>
        <option value="ngo">NGO</option>
      </select>
    </div>

    <div className="form-group">
      <label>GST Number *</label>
      <input
        type="text"
        name="gstNumber"
        value={formData.gstNumber}
        onChange={handleInputChange}
        className={errors.gstNumber ? "error" : ""}
      />
      {errors.gstNumber && <span className="error-text">{errors.gstNumber}</span>}
    </div>

    <div className="form-group">
      <label>GST Certificate Image *</label>
      <input
        type="file"
        name="gstImage"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className={errors.gstImage ? "error" : ""}
      />
      {errors.gstImage && <span className="error-text">{errors.gstImage}</span>}
    </div>

    <div className="form-group">
      <label>PAN Number *</label>
      <input
        type="text"
        name="panNumber"
        value={formData.panNumber}
        onChange={handleInputChange}
        className={errors.panNumber ? "error" : ""}
      />
      {errors.panNumber && <span className="error-text">{errors.panNumber}</span>}
    </div>

    <div className="form-group">
      <label>PAN Certificate Image *</label>
      <input
        type="file"
        name="panImage"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className={errors.panImage ? "error" : ""}
      />
      {errors.panImage && <span className="error-text">{errors.panImage}</span>}
    </div>

    <div className="form-group">
      <label>Business Description</label>
      <textarea
        name="businessDescription"
        value={formData.businessDescription}
        onChange={handleInputChange}
        rows="4"
        placeholder="Tell us about your business..."
      />
    </div>
  </div>
);

const StepBanking = ({ formData, handleInputChange, handleFileChange, errors }) => (
  <div className="step-content">
    <h2>Banking Information</h2>

    <div className="form-group">
      <label>Account Holder Name *</label>
      <input
        type="text"
        name="accountHolderName"
        value={formData.accountHolderName}
        onChange={handleInputChange}
        className={errors.accountHolderName ? "error" : ""}
      />
      {errors.accountHolderName && <span className="error-text">{errors.accountHolderName}</span>}
    </div>

    <div className="form-group">
      <label>Account Number *</label>
      <input
        type="text"
        name="accountNumber"
        value={formData.accountNumber}
        onChange={handleInputChange}
        className={errors.accountNumber ? "error" : ""}
      />
      {errors.accountNumber && <span className="error-text">{errors.accountNumber}</span>}
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Account Type *</label>
        <select name="accountType" value={formData.accountType} onChange={handleInputChange}>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
        </select>
      </div>

      <div className="form-group">
        <label>IFSC Code *</label>
        <input
          type="text"
          name="ifscCode"
          value={formData.ifscCode}
          onChange={handleInputChange}
          className={errors.ifscCode ? "error" : ""}
        />
        {errors.ifscCode && <span className="error-text">{errors.ifscCode}</span>}
      </div>
    </div>

    <div className="form-group">
      <label>Bank Name *</label>
      <input
        type="text"
        name="bankName"
        value={formData.bankName}
        onChange={handleInputChange}
        className={errors.bankName ? "error" : ""}
      />
      {errors.bankName && <span className="error-text">{errors.bankName}</span>}
    </div>

    <div className="form-group">
      <label>Cancelled Cheque Image *</label>
      <input
        type="file"
        name="cancelledCheckImage"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className={errors.cancelledCheckImage ? "error" : ""}
      />
      {errors.cancelledCheckImage && <span className="error-text">{errors.cancelledCheckImage}</span>}
    </div>
  </div>
);

const StepConsents = ({ formData, handleInputChange, errors }) => (
  <div className="step-content">
    <h2>Consents & Agreements</h2>

    <div className="consent-group">
      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleInputChange}
        />
        <span>I accept the Terms & Conditions *</span>
      </label>
      {errors.termsAccepted && <span className="error-text">{errors.termsAccepted}</span>}
    </div>

    <div className="consent-group">
      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="privacyAccepted"
          checked={formData.privacyAccepted}
          onChange={handleInputChange}
        />
        <span>I accept the Privacy Policy *</span>
      </label>
      {errors.privacyAccepted && <span className="error-text">{errors.privacyAccepted}</span>}
    </div>

    <div className="consent-group">
      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="communicationConsent"
          checked={formData.communicationConsent}
          onChange={handleInputChange}
        />
        <span>I agree to receive communications from Smitox</span>
      </label>
    </div>
  </div>
);

const StepReview = ({ formData, selectedPlan }) => (
  <div className="step-content">
    <h2>Review Your Application</h2>
    <p>Please review your information before submitting</p>

    <div className="review-section">
      <h3>Selected Plan</h3>
      <p className="review-item">
        <strong>{selectedPlan?.name}</strong> - ₹{selectedPlan?.price || "Free"}
      </p>
    </div>

    <div className="review-section">
      <h3>Personal Information</h3>
      <p className="review-item">
        <strong>Name:</strong> {formData.firstName} {formData.lastName}
      </p>
      <p className="review-item">
        <strong>Email:</strong> {formData.email}
      </p>
      <p className="review-item">
        <strong>Phone:</strong> {formData.phone}
      </p>
    </div>

    <div className="review-section">
      <h3>Business Information</h3>
      <p className="review-item">
        <strong>Business Name:</strong> {formData.businessName}
      </p>
      <p className="review-item">
        <strong>Business Type:</strong> {formData.businessType}
      </p>
      <p className="review-item">
        <strong>GST Number:</strong> {formData.gstNumber}
      </p>
    </div>

    <div className="review-note">
      <p>✓ All information has been filled correctly</p>
      <p>✓ All required documents have been uploaded</p>
      <p>✓ You have accepted all terms and conditions</p>
    </div>
  </div>
);

export default SellerWizard;
