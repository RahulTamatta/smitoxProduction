import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import {
  getActiveSubscriptionPlans,
  getMyApplication,
  retryPayment,
  submitApplicationDirect,
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
  const [applicationStatus, setApplicationStatus] = useState("");
  const [applicationDetails, setApplicationDetails] = useState(null); // Store full app details
  const [isLocked, setIsLocked] = useState(false);

  const [formData, setFormData] = useState({
    selectedPlanId: "",
    // Step 1: Account Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    // Step 2: Business Details
    storeName: "",
    legalBusinessName: "",
    businessName: "",
    businessType: "sole_proprietor",
    businessCategory: "",
    yearsInBusiness: "",
    businessDescription: "",
    // Step 2: Business Address
    addressLine1: "",
    addressLine2: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    country: "India",
    // Pickup Address
    pickupAddressLine1: "",
    pickupCity: "",
    pickupState: "",
    pickupPincode: "",
    // Step 3: Tax & GST
    panNumber: "",
    panImage: null,
    gstNumber: "",
    gstExemptionDeclared: false,
    gstImage: null,
    // Step 4: Bank
    accountHolderName: "",
    accountNumber: "",
    accountType: "savings",
    ifscCode: "",
    bankName: "",
    cancelledCheckImage: null,
    // Step 5: Documents
    identityProofType: "aadhar",
    identityProofNumber: "",
    identityProofImage: null,
    addressProofType: "aadhar",
    addressProofImage: null,
    // Step 6: Agreement
    termsAccepted: false,
    privacyAccepted: false,
    communicationConsent: false,
  });

  // Fetch plans and check existing application
  useEffect(() => {
    // Load Razorpay Script
    const loadRazorpayScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");

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
              setApplicationStatus(app.status);
              setApplicationDetails(app);

              // Pre-fill formData from existing application
              setFormData(prev => ({
                ...prev,
                selectedPlanId: app.selectedPlan?._id || app.selectedPlanId || "",
                firstName: app.firstName || prev.firstName,
                lastName: app.lastName || prev.lastName,
                email: app.email || prev.email,
                phone: app.phone || prev.phone,
                alternatePhone: app.alternatePhone || "",
                addressLine1: app.addressLine1 || "",
                addressLine2: app.addressLine2 || "",
                area: app.area || "",
                city: app.city || "",
                state: app.state || "",
                pincode: app.pincode || "",
                landmark: app.landmark || "",
                country: app.country || "India",
                pickupAddressLine1: app.pickupAddressLine1 || "",
                pickupCity: app.pickupCity || "",
                pickupState: app.pickupState || "",
                pickupPincode: app.pickupPincode || "",
                storeName: app.storeName || "",
                legalBusinessName: app.legalBusinessName || "",
                businessName: app.businessName || "",
                businessType: app.businessType || "sole_proprietor",
                businessCategory: app.businessCategory || "",
                yearsInBusiness: app.yearsInBusiness || "",
                businessDescription: app.businessDescription || "",
                panNumber: app.panNumber || "",
                gstNumber: app.gstNumber || "",
                gstExemptionDeclared: app.gstExemptionDeclared || false,
                accountHolderName: app.accountHolderName || "",
                accountNumber: app.accountNumber || "",
                accountType: app.accountType || "savings",
                ifscCode: app.ifscCode || "",
                bankName: app.bankName || "",
                identityProofType: app.identityProofType || "aadhar",
                identityProofNumber: app.identityProofNumber || "",
                addressProofType: app.addressProofType || "aadhar",
              }));

              // If application is submitted/under_review/approved_pending_payment, lock plan
              if (
                ["submitted", "under_review", "approved_pending_payment"].includes(
                  app.status
                )
              ) {
                setIsLocked(true);
              }

              // If rejected or reupload_requested, allow re-edit
              if (app.status === "rejected" || app.status === "reupload_requested") {
                setIsLocked(false);
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

  // ... (rest of code)

  // ... inside handlePayment and renderPaymentStep ...
  // I need to update renderPaymentStep below.
  // This tool call handles the state init and useEffect updates.
  // I will skip the rest of the file update here to be safe and do render in next tool.
  // But wait, the StartLine/EndLine logic must align. 
  // I am replacing from line 22 to 100 approx.
  // I'll cover the whole useEffect block.



  // Handle form input change with validation
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    // Numeric field validation
    if (name === "phone" || name === "alternatePhone" || name === "pincode" || name === "accountNumber" || name === "pickupPincode") {
      finalValue = value.replace(/[^0-9]/g, "");
    }

    // Phone: max 10 digits
    if (name === "phone" || name === "alternatePhone") {
      finalValue = finalValue.slice(0, 10);
    }

    // Pincode: max 6 digits
    if (name === "pincode" || name === "pickupPincode") {
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



  // Submit application directly (no draft)
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

      // Create FormData and submit directly
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] instanceof File) {
          formDataToSend.append(key, formData[key]);
        } else if (typeof formData[key] === 'boolean') {
          formDataToSend.append(key, formData[key] ? 'true' : 'false');
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const submitRes = await submitApplicationDirect(formDataToSend, auth?.token);

      if (submitRes.success) {
        setSuccess("Application submitted successfully!");
        setApplicationId(submitRes.applicationId);
        setIsLocked(true);
        setTimeout(() => {
          navigate("/seller/status");
        }, 2000);
      } else {
        throw new Error(submitRes.message || "Failed to submit application");
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
            className={`plan-card ${formData.selectedPlanId === plan._id ? "selected" : ""
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
              className={`btn btn-primary w-100 ${formData.selectedPlanId === plan._id ? "selected" : ""
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

  // Steps 1-6: Form Fields (matching planning docs)
  const renderFormStep = () => {
    const steps = [
      {
        title: "Step 1: Account Details",
        subtitle: "Basic contact information",
        fields: ["firstName", "lastName", "email", "phone", "alternatePhone"],
      },
      {
        title: "Step 2: Business Details",
        subtitle: "Your business and address information",
        fields: [
          "storeName", "legalBusinessName", "businessType", "businessCategory",
          "yearsInBusiness", "businessDescription",
          "addressLine1", "addressLine2", "area", "city", "state", "pincode", "landmark",
          "pickupAddressLine1", "pickupCity", "pickupState", "pickupPincode",
        ],
      },
      {
        title: "Step 3: Tax & GST Details",
        subtitle: "PAN and GST information for compliance",
        fields: [
          "panNumber", "panImage",
          "gstNumber", "gstExemptionDeclared", "gstImage",
        ],
      },
      {
        title: "Step 4: Bank Account (Payout)",
        subtitle: "Bank details for seller payouts",
        fields: [
          "accountHolderName", "accountNumber", "accountType",
          "ifscCode", "bankName", "cancelledCheckImage",
        ],
      },
      {
        title: "Step 5: Document Upload",
        subtitle: "Identity and address verification documents",
        fields: [
          "identityProofType", "identityProofNumber", "identityProofImage",
          "addressProofType", "addressProofImage",
        ],
      },
      {
        title: "Step 6: Agreement & Submit",
        subtitle: "Review and accept the seller agreement",
        fields: ["termsAccepted", "privacyAccepted", "communicationConsent"],
      },
    ];

    const step = steps[currentStep - 1];
    // Get reupload requested fields for highlighting
    const reuploadFields = applicationDetails?.reuploadRequestedFields || [];

    return (
      <div className="wizard-step">
        <h2 className="step-title">{step.title}</h2>
        {step.subtitle && <p className="step-subtitle">{step.subtitle}</p>}

        {applicationStatus === "reupload_requested" && applicationDetails?.reuploadReason && (
          <div className="alert alert-warning mb-4">
            <AlertCircle size={20} />
            <span><strong>Admin requested changes:</strong> {applicationDetails.reuploadReason}</span>
          </div>
        )}

        <div className="form-group">
          {step.fields.map((field) => (
            <div key={field} className={`mb-3 ${reuploadFields.includes(field) ? 'reupload-highlight' : ''}`}>
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
      firstName: "First Name *",
      lastName: "Last Name *",
      email: "Email Address *",
      phone: "Mobile Number *",
      alternatePhone: "Alternate Contact Number",
      storeName: "Store Display Name *",
      legalBusinessName: "Legal Business Name *",
      businessName: "Business Name *",
      businessType: "Business Type *",
      businessCategory: "Business Category *",
      yearsInBusiness: "Years in Operation",
      businessDescription: "Business Description",
      addressLine1: "Business Address Line 1 *",
      addressLine2: "Address Line 2",
      area: "Area / Locality",
      city: "City *",
      state: "State *",
      pincode: "Pincode *",
      landmark: "Landmark",
      pickupAddressLine1: "Pickup Address Line 1",
      pickupCity: "Pickup City",
      pickupState: "Pickup State",
      pickupPincode: "Pickup Pincode",
      panNumber: "PAN Number *",
      panImage: "PAN Card Image *",
      gstNumber: "GST Number",
      gstExemptionDeclared: "I confirm my business is eligible to sell without GST under applicable Indian regulations",
      gstImage: "GST Certificate",
      identityProofType: "Identity Proof Type *",
      identityProofNumber: "Identity Proof Number *",
      identityProofImage: "Identity Proof Image (Front) *",
      addressProofType: "Address Proof Type",
      addressProofImage: "Address Proof Document",
      accountHolderName: "Account Holder Name *",
      accountNumber: "Account Number *",
      accountType: "Account Type *",
      ifscCode: "IFSC Code *",
      bankName: "Bank Name *",
      cancelledCheckImage: "Cancelled Cheque / Bank Statement",
      termsAccepted: "I accept the Terms & Conditions *",
      privacyAccepted: "I accept the Seller Commission Agreement & Privacy Policy *",
      communicationConsent: "I accept the Refund, Cancellation & Marketplace Rules",
    };

    const selectOptions = {
      identityProofType: [
        { value: "aadhar", label: "Aadhaar Card" },
        { value: "passport", label: "Passport" },
        { value: "driving_license", label: "Driving License" },
        { value: "voter_id", label: "Voter ID" },
      ],
      addressProofType: [
        { value: "gst_certificate", label: "GST Certificate" },
        { value: "shop_act", label: "Shop Act License" },
        { value: "business_registration", label: "Business Registration" },
        { value: "utility_bill", label: "Electricity / Utility Bill" },
      ],
      businessType: [
        { value: "sole_proprietor", label: "Individual / Proprietor" },
        { value: "partnership", label: "Partnership Firm" },
        { value: "pvt_ltd", label: "Private Limited Company" },
        { value: "llp", label: "LLP" },
        { value: "manufacturer", label: "Manufacturer" },
        { value: "trader_distributor", label: "Trader / Distributor" },
      ],
      businessCategory: [
        { value: "steel", label: "Steel & Iron" },
        { value: "metals", label: "Metals & Alloys" },
        { value: "industrial", label: "Industrial Supplies" },
        { value: "chemicals", label: "Chemicals" },
        { value: "construction", label: "Construction Materials" },
        { value: "electronics", label: "Electronics & Electrical" },
        { value: "food", label: "Food Products" },
        { value: "pharma", label: "Pharmaceuticals" },
        { value: "other", label: "Other" },
      ],
      accountType: [
        { value: "savings", label: "Savings" },
        { value: "current", label: "Current" },
      ],
    };

    const label = fieldLabels[fieldName];

    // Checkbox fields
    if (
      ["termsAccepted", "privacyAccepted", "communicationConsent", "gstExemptionDeclared"].includes(
        fieldName
      )
    ) {
      // Only show GST exemption if gstNumber is empty
      if (fieldName === "gstExemptionDeclared" && formData.gstNumber) {
        return null;
      }
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
      const options = selectOptions[fieldName];
      return (
        <>
          <label className="form-label">{label}</label>
          <select
            name={fieldName}
            value={formData[fieldName]}
            onChange={handleInputChange}
            className="form-control"
          >
            <option value="">Select {label.replace(' *', '')}</option>
            {options.map((option) => {
              const val = typeof option === 'string' ? option : option.value;
              const display = typeof option === 'string' ? option.replace(/_/g, ' ') : option.label;
              return (
                <option key={val} value={val}>
                  {display}
                </option>
              );
            })}
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
  const stepLabels = [
    "Plan", "Account", "Business", "Tax & GST", "Bank", "Documents", "Agreement"
  ];

  const renderProgress = () => (
    <div className="progress-container">
      <div className="progress-steps">
        {stepLabels.map((label, idx) => (
          <div
            key={idx}
            className={`progress-step ${idx <= currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">
              {idx < currentStep ? <Check size={14} /> : idx + 1}
            </div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / 7) * 100}%` }}
        />
      </div>
    </div>
  );

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Get updated payment order
      const response = await retryPayment(applicationId, auth?.token);

      if (response.success && response.checkoutInfo) {
        const { orderId, amount, currency, key } = response.checkoutInfo;

        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: "Smitox Seller Subscription",
          description: "Subscription Payment",
          order_id: orderId,
          handler: async function (response) {
            try {
              setLoading(true);
              // Verify Payment
              // We use direct axios call as verifyPayment might not be in serviceApi yet or we can add it there.
              // Assuming relative path works with proxy setup or use full path.
              // Note: You need to import axios if not imported.
              // Let's assume axios is available or use fetch?
              // The file imports: import React... no axios.
              // I need to add import axios from 'axios'. I will do that in a separate step or here if I can view imports.
              // I can't import axios here easily without editing top of file.
              // I will use fetch for verify or assume axios is globally configured? No.
              // I'll add axios import in a separate tool call.
              const verifyRes = await fetch("/api/v1/seller/verify-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": auth?.token
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              const verifyData = await verifyRes.json();

              if (verifyRes.ok && verifyData.success) {
                setSuccess("Payment successful! Redirecting to dashboard...");
                setTimeout(() => {
                  navigate("/dashboard/seller");
                }, 2000);
              } else {
                throw new Error(verifyData.message || "Payment verification failed");
              }
            } catch (err) {
              console.error(err);
              setError("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          },
          prefill: {
            name: formData.firstName + " " + formData.lastName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#3399cc",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        razorpay.on('payment.failed', function (response) {
          setError("Payment failed: " + response.error.description);
          setLoading(false);
        });

      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (err) {
      setError(err.message || "Payment initiation failed");
      setLoading(false);
    }
  };

  // Payment Step View
  const renderPaymentStep = () => {
    // Determine Price to Show
    let displayPrice = 0;
    let displayName = "Seller Subscription";

    if (applicationDetails) {
      // Priority 1: Existing Payment Record Amount
      if (applicationDetails.payment && applicationDetails.payment.amount) {
        displayPrice = applicationDetails.payment.amount;
      }
      // Priority 2: Snapshot Price
      else if (applicationDetails.selectedPlanSnapshot && applicationDetails.selectedPlanSnapshot.price) {
        displayPrice = applicationDetails.selectedPlanSnapshot.price;
        displayName = applicationDetails.selectedPlanSnapshot.name;
      }
    }

    // Fallback: Check plans list
    if (displayPrice === 0 && formData.selectedPlanId) {
      const found = plans.find(p => p._id === formData.selectedPlanId);
      if (found) {
        displayPrice = found.price;
        displayName = found.name;
      }
    }

    return (
      <div className="wizard-step text-center">
        <h2 className="step-title">Complete Your Payment</h2>
        <p className="step-subtitle">Your application has been approved. Please complete the payment to activate your seller account.</p>

        <div className="payment-card card shadow-sm p-4 mx-auto" style={{ maxWidth: '500px' }}>
          <div className="mb-4">
            <h3>{displayName}</h3>
            <p className="text-muted">Subscription Fee</p>
            <h2 className="text-primary">
              ₹{displayPrice}
            </h2>
          </div>

          <button
            className="btn btn-primary btn-lg w-100"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    );
  };

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

  // Determine if we should show payment step
  // If application exists and is approved_pending_payment
  const showPayment = applicationId && isLocked && plans.find(p => p._id === formData.selectedPlanId) && !plans.find(p => p._id === formData.selectedPlanId)?.isFree;
  // Wait, isLocked is set for 'approved_pending_payment' in useEffect.
  // So if isLocked is true, we check status.
  // But status isn't stored in state directly except implicity.
  // I need to store status or check it.
  // I'll check useEffect again... it sets isLocked but doesn't store status in a state variable for render?
  // Ah, it doesn't store 'status' in state. I should add `applicationStatus` state.

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

          {applicationStatus === "approved_pending_payment" ? (
            renderPaymentStep()
          ) : currentStep === 0 ? (
            renderPlanSelection()
          ) : (
            renderFormStep()
          )}

          {applicationStatus !== "approved_pending_payment" && (
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
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={loading}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}

              {currentStep === 6 && (
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
              )}
            </div>
          )}

          {isLocked && applicationStatus !== "approved_pending_payment" && (
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
