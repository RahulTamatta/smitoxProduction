import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import {
  getActiveSubscriptionPlans,
  getMyApplication,
  submitApplicationDirect,
} from "../../services/sellerApi";
import states from "../../utils/states";

// Short "Become a Seller" flow with minimal KYC: plan, business basics, address,
// one identity document (Aadhaar or PAN), review. Admin review and (for paid
// plans) payment continue on the existing /seller/status page.

const STEPS = ["Plan", "Business", "Address", "KYC", "Review"];
const EDITABLE_STATUSES = ["draft", "rejected", "reupload_requested"];
const BUSINESS_TYPES = [
  ["sole_proprietor", "Individual / Sole proprietor"],
  ["partnership", "Partnership"],
  ["pvt_ltd", "Private Limited"],
  ["llp", "LLP"],
  ["manufacturer", "Manufacturer"],
  ["trader_distributor", "Trader / Distributor"],
  ["ngo", "NGO"],
];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EMPTY = {
  selectedPlanId: "",
  storeName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  businessType: "sole_proprietor",
  businessCategory: "",
  businessDescription: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  identityProofType: "aadhar",
  identityProofNumber: "",
  termsAccepted: false,
  privacyAccepted: false,
};

const cleanIdNumber = (type, value) =>
  type === "aadhar" ? value.replace(/\D/g, "") : value.replace(/\s/g, "").toUpperCase();

const validateStep = (step, form, file) => {
  const e = {};
  if (step === 0 && !form.selectedPlanId) e.selectedPlanId = "Choose a plan to continue";
  if (step === 1) {
    if (!form.storeName.trim()) e.storeName = "Store name is required";
    else if (form.storeName.trim().length > 80) e.storeName = "Keep it under 80 characters";
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a 10-digit mobile number";
    if (form.businessDescription.length > 500) e.businessDescription = "Keep it under 500 characters";
  }
  if (step === 2) {
    if (!form.addressLine1.trim()) e.addressLine1 = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state) e.state = "Select your state";
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
  }
  if (step === 3) {
    const num = cleanIdNumber(form.identityProofType, form.identityProofNumber);
    if (form.identityProofType === "aadhar" && !/^\d{12}$/.test(num)) {
      e.identityProofNumber = "Aadhaar number must be 12 digits";
    }
    if (form.identityProofType === "pan" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(num)) {
      e.identityProofNumber = "Enter a valid PAN, e.g. ABCDE1234F";
    }
    if (!file) e.identityProofImage = "Upload a photo or scan of the card";
  }
  if (step === 4) {
    if (!form.termsAccepted) e.termsAccepted = "Please accept the Terms of Use";
    if (!form.privacyAccepted) e.privacyAccepted = "Please accept the Privacy Policy";
  }
  return e;
};

const Field = ({ label, error, children, hint }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold">{label}</label>
    {children}
    {hint && !error && <div className="form-text">{hint}</div>}
    {error && <div className="text-danger small mt-1">{error}</div>}
  </div>
);

const SellerQuickApply = () => {
  const navigate = useNavigate();
  const contextValue = useAuth();
  const auth = contextValue[0];
  const authLoading = contextValue[5];

  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!auth?.token) {
      navigate("/login", { state: { from: "/seller-wizard" } });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const plansRes = await getActiveSubscriptionPlans();
        if (!cancelled && plansRes?.success) setPlans(plansRes.plans || []);
      } catch {
        if (!cancelled) toast.error("Could not load plans. Please refresh.");
      }

      let app = null;
      try {
        const appRes = await getMyApplication(auth.token);
        if (appRes?.success) app = appRes.application || null;
      } catch {
        app = null; // no application yet
      }
      if (cancelled) return;

      if (app && !EDITABLE_STATUSES.includes(app.status)) {
        navigate("/seller/status", { replace: true });
        return;
      }
      setForm((prev) => {
        const next = {
          ...prev,
          email: prev.email || auth.user?.email_id || "",
          phone: prev.phone || (auth.user?.mobile_no ? String(auth.user.mobile_no) : ""),
        };
        if (app) {
          for (const key of [
            "firstName", "lastName", "email", "phone", "storeName", "businessType",
            "businessCategory", "businessDescription", "addressLine1", "addressLine2",
            "city", "state", "pincode", "identityProofType",
          ]) {
            if (app[key]) next[key] = String(app[key]);
          }
          next.selectedPlanId = app.selectedPlan?._id || app.selectedPlanId || "";
          if (!next.storeName && app.businessName) next.storeName = app.businessName;
        }
        return next;
      });
      if (app?.reviewNotes && app.status !== "draft") setReviewNote(app.reviewNotes);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, auth?.token, auth?.user, navigate]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === form.selectedPlanId),
    [plans, form.selectedPlanId]
  );

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setErrors((prev) => ({ ...prev, identityProofImage: "File must be 5 MB or smaller" }));
      e.target.value = "";
      return;
    }
    setFile(f);
    setErrors((prev) => ({ ...prev, identityProofImage: undefined }));
  };

  const next = () => {
    const e = validateStep(step, form, file);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    // Re-validate everything so an edited earlier step can't slip through
    for (let i = 0; i < STEPS.length; i += 1) {
      const e = validateStep(i, form, file);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(i);
        return;
      }
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      const idNumber = cleanIdNumber(form.identityProofType, form.identityProofNumber);
      const payload = {
        selectedPlanId: form.selectedPlanId,
        storeName: form.storeName.trim(),
        businessName: form.storeName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ""),
        businessType: form.businessType,
        businessCategory: form.businessCategory.trim(),
        businessDescription: form.businessDescription.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        identityProofType: form.identityProofType,
        identityProofNumber: idNumber,
        termsAccepted: "true",
        privacyAccepted: "true",
      };
      Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
      fd.append("identityProofImage", file);

      const res = await submitApplicationDirect(fd, auth.token);
      if (!res?.success) throw res || new Error("Submission failed");
      toast.success("Application submitted");
      navigate("/seller/status");
    } catch (err) {
      const missing = Array.isArray(err?.missingFields) && err.missingFields.length
        ? ` Missing: ${err.missingFields.join(", ")}.`
        : "";
      setSubmitError(`${err?.message || "Could not submit your application."}${missing}`);
    } finally {
      setSubmitting(false);
    }
  };

  const maskedId =
    form.identityProofType === "aadhar"
      ? `XXXX XXXX ${cleanIdNumber("aadhar", form.identityProofNumber).slice(-4)}`
      : cleanIdNumber("pan", form.identityProofNumber);

  const priceLabel = (p) => (p.isFree || !p.price ? "Free" : `₹${Number(p.price).toLocaleString("en-IN")} / ${p.billingCycle}`);

  return (
    <Layout title="Become a Seller - Smitox" description="Start selling on Smitox in a few minutes.">
      <div className="container py-4" style={{ maxWidth: 720 }}>
        <h1 className="h3 mb-1">Become a Seller</h1>
        <p className="text-muted mb-4">Five quick steps. We review applications within 1-2 business days.</p>

        {/* Progress */}
        <ol className="d-flex list-unstyled gap-2 mb-4" aria-label="Application progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-fill text-center">
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: i <= step ? "#d32f2f" : "#e5e7eb",
                  marginBottom: 6,
                }}
              />
              <span className={`small ${i === step ? "fw-semibold" : "text-muted"}`}>{label}</span>
            </li>
          ))}
        </ol>

        {reviewNote && (
          <div className="alert alert-warning">
            <strong>Reviewer note:</strong> {reviewNote}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status" aria-label="Loading" />
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body p-4">
              {step === 0 && (
                <>
                  <h2 className="h5 mb-3">Choose a plan</h2>
                  {plans.length === 0 && <p className="text-muted">No plans are available right now.</p>}
                  <div className="row g-3">
                    {plans.map((p) => {
                      const selected = p._id === form.selectedPlanId;
                      return (
                        <div className="col-12 col-md-6" key={p._id}>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, selectedPlanId: p._id }));
                              setErrors({});
                            }}
                            className="w-100 text-start p-3 h-100"
                            style={{
                              border: `2px solid ${selected ? "#d32f2f" : "#e5e7eb"}`,
                              borderRadius: 12,
                              background: selected ? "#fff5f5" : "#fff",
                            }}
                            aria-pressed={selected}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="fw-semibold">{p.name}</span>
                              {p.badgeText && <span className="badge bg-danger">{p.badgeText}</span>}
                            </div>
                            <div className="fs-5 fw-bold my-1">{priceLabel(p)}</div>
                            <div className="small text-muted">
                              {typeof p.maxProducts === "number" ? `Up to ${p.maxProducts} listings` : "Unlimited listings"}
                            </div>
                            {(p.features || []).slice(0, 3).map((f, i) => (
                              <div className="small mt-1" key={i}>✓ {typeof f === "string" ? f : f.name}</div>
                            ))}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {errors.selectedPlanId && <div className="text-danger small mt-2">{errors.selectedPlanId}</div>}
                </>
              )}

              {step === 1 && (
                <>
                  <h2 className="h5 mb-3">Your business</h2>
                  <Field label="Store name" error={errors.storeName}>
                    <input className="form-control" value={form.storeName} onChange={set("storeName")} maxLength={80} />
                  </Field>
                  <div className="row">
                    <div className="col-md-6">
                      <Field label="First name" error={errors.firstName}>
                        <input className="form-control" value={form.firstName} onChange={set("firstName")} />
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Last name" error={errors.lastName}>
                        <input className="form-control" value={form.lastName} onChange={set("lastName")} />
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Email" error={errors.email}>
                        <input type="email" className="form-control" value={form.email} onChange={set("email")} />
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Mobile number" error={errors.phone}>
                        <input inputMode="numeric" className="form-control" value={form.phone} onChange={set("phone")} maxLength={14} />
                      </Field>
                    </div>
                  </div>
                  <Field label="Business type">
                    <select className="form-select" value={form.businessType} onChange={set("businessType")}>
                      {BUSINESS_TYPES.map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="What do you sell? (optional)" hint="e.g. Kitchenware, Toys, Stationery">
                    <input className="form-control" value={form.businessCategory} onChange={set("businessCategory")} maxLength={80} />
                  </Field>
                  <Field label="About your store (optional)" error={errors.businessDescription}>
                    <textarea className="form-control" rows={3} value={form.businessDescription} onChange={set("businessDescription")} maxLength={500} />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="h5 mb-3">Business address</h2>
                  <Field label="Address line 1" error={errors.addressLine1}>
                    <input className="form-control" value={form.addressLine1} onChange={set("addressLine1")} />
                  </Field>
                  <Field label="Address line 2 (optional)">
                    <input className="form-control" value={form.addressLine2} onChange={set("addressLine2")} />
                  </Field>
                  <div className="row">
                    <div className="col-md-5">
                      <Field label="City" error={errors.city}>
                        <input className="form-control" value={form.city} onChange={set("city")} />
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <Field label="State" error={errors.state}>
                        <select className="form-select" value={form.state} onChange={set("state")}>
                          <option value="">Select</option>
                          {states.map((s) => (
                            <option key={s.code} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-3">
                      <Field label="Pincode" error={errors.pincode}>
                        <input inputMode="numeric" className="form-control" value={form.pincode} onChange={set("pincode")} maxLength={6} />
                      </Field>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="h5 mb-3">Identity (KYC)</h2>
                  <Field label="Document">
                    <div className="d-flex gap-4">
                      {[["aadhar", "Aadhaar card"], ["pan", "PAN card"]].map(([v, l]) => (
                        <label key={v} className="form-check">
                          <input
                            type="radio"
                            className="form-check-input"
                            name="identityProofType"
                            value={v}
                            checked={form.identityProofType === v}
                            onChange={() => {
                              setForm((prev) => ({ ...prev, identityProofType: v, identityProofNumber: "" }));
                              setErrors((prev) => ({ ...prev, identityProofNumber: undefined }));
                            }}
                          />
                          <span className="form-check-label">{l}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field
                    label={form.identityProofType === "aadhar" ? "Aadhaar number" : "PAN number"}
                    error={errors.identityProofNumber}
                    hint={form.identityProofType === "aadhar" ? "We only keep the last 4 digits of your Aadhaar number." : undefined}
                  >
                    <input
                      className="form-control"
                      value={form.identityProofNumber}
                      onChange={set("identityProofNumber")}
                      placeholder={form.identityProofType === "aadhar" ? "1234 5678 9012" : "ABCDE1234F"}
                      maxLength={form.identityProofType === "aadhar" ? 14 : 10}
                      autoComplete="off"
                    />
                  </Field>
                  <Field
                    label="Upload the card"
                    error={errors.identityProofImage}
                    hint="A clear photo or scan (JPG, PNG or PDF, up to 5 MB)."
                  >
                    <input type="file" className="form-control" accept="image/*,application/pdf" onChange={onFile} />
                    {file && <div className="small mt-1">Selected: {file.name}</div>}
                  </Field>
                </>
              )}

              {step === 4 && (
                <>
                  <h2 className="h5 mb-3">Review and submit</h2>
                  <dl className="row small mb-3">
                    {[
                      ["Plan", selectedPlan ? `${selectedPlan.name} (${priceLabel(selectedPlan)})` : "-"],
                      ["Store", form.storeName],
                      ["Name", `${form.firstName} ${form.lastName}`],
                      ["Email", form.email],
                      ["Mobile", form.phone],
                      ["Business type", (BUSINESS_TYPES.find(([v]) => v === form.businessType) || [])[1]],
                      ["Address", [form.addressLine1, form.addressLine2, form.city, form.state, form.pincode].filter(Boolean).join(", ")],
                      ["ID", `${form.identityProofType === "aadhar" ? "Aadhaar" : "PAN"} ${maskedId}`],
                      ["Document", file?.name || "-"],
                    ].map(([k, v]) => (
                      <Fragment key={k}>
                        <dt className="col-4 text-muted fw-normal">{k}</dt>
                        <dd className="col-8">{v}</dd>
                      </Fragment>
                    ))}
                  </dl>
                  {selectedPlan && !selectedPlan.isFree && Number(selectedPlan.price) > 0 && (
                    <div className="alert alert-info small">
                      Payment for the {selectedPlan.name} plan is collected after the admin approves your application.
                    </div>
                  )}
                  <div className="form-check mb-1">
                    <input id="terms" type="checkbox" className="form-check-input" checked={form.termsAccepted} onChange={set("termsAccepted")} />
                    <label htmlFor="terms" className="form-check-label">
                      I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Use</a>
                    </label>
                    {errors.termsAccepted && <div className="text-danger small">{errors.termsAccepted}</div>}
                  </div>
                  <div className="form-check mb-3">
                    <input id="privacy" type="checkbox" className="form-check-input" checked={form.privacyAccepted} onChange={set("privacyAccepted")} />
                    <label htmlFor="privacy" className="form-check-label">
                      I accept the <a href="/policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                    </label>
                    {errors.privacyAccepted && <div className="text-danger small">{errors.privacyAccepted}</div>}
                  </div>
                  {submitError && <div className="alert alert-danger small">{submitError}</div>}
                </>
              )}

              <div className="d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={back} disabled={step === 0 || submitting}>
                  Back
                </button>
                {step < STEPS.length - 1 ? (
                  <button type="button" className="btn btn-danger" onClick={next}>
                    Continue
                  </button>
                ) : (
                  <button type="button" className="btn btn-danger" onClick={submit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit application"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerQuickApply;
