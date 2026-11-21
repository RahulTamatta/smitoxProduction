import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";

// Admin control centre for vendors: profile, KYC, visibility, storefront priority,
// subscription grants (with or without a paid plan), listings, add and remove.

const API = "/api/v1/admin/vendors";
const COMPLIMENTARY = "__complimentary__";
const STATUS_BADGE = {
  active: "bg-success",
  inactive: "bg-secondary",
  suspended: "bg-danger",
  expired_payment_failed: "bg-warning text-dark",
};
const PLAN_STATUS_BADGE = {
  active: "bg-success",
  expiring_soon: "bg-warning text-dark",
  grace_period: "bg-warning text-dark",
  expired: "bg-danger",
};
const errMsg = (e, fallback) => e?.response?.data?.message || fallback;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "No expiry");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
// Only server-stored upload paths become links (never arbitrary URLs/javascript:)
const docHref = (p) => (typeof p === "string" && /^uploads\/[\w./-]+$/.test(p) ? `/${p}` : null);

const Overlay = ({ title, onClose, children, wide }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onClick={onClose}
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1060, overflowY: "auto", padding: "24px 12px" }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3 shadow mx-auto"
      style={{ maxWidth: wide ? 1000 : 520, width: "100%" }}
    >
      <div className="d-flex justify-content-between align-items-center border-bottom px-4 py-3">
        <h2 className="h5 mb-0">{title}</h2>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

const PlanSelect = ({ plans, value, onChange }) => (
  <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value={COMPLIMENTARY}>No subscription (complimentary access)</option>
    {plans.map((p) => (
      <option key={p._id} value={p._id}>
        {p.name} — {p.isFree ? "Free" : `${money(p.price)}/${p.billingCycle}`}
        {typeof p.maxProducts === "number" ? ` · ${p.maxProducts} listings` : " · unlimited"}
        {p.isActive === false ? " (inactive)" : ""}
      </option>
    ))}
  </select>
);

/* ------------------------------ Add vendor ------------------------------ */
const AddVendor = ({ plans, onClose, onCreated }) => {
  const [form, setForm] = useState({ contact: "", storeName: "", planId: COMPLIMENTARY, days: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const contact = form.contact.trim();
    if (!contact || !form.storeName.trim()) return toast.error("Email/phone and store name are required");
    setSaving(true);
    try {
      const isEmail = contact.includes("@");
      await axios.post(API, {
        ...(isEmail ? { email: contact } : { phone: contact }),
        storeName: form.storeName.trim(),
        planId: form.planId === COMPLIMENTARY ? null : form.planId,
        expiresInDays: form.days ? Number(form.days) : null,
      });
      toast.success("Vendor created");
      onCreated();
    } catch (err) {
      toast.error(errMsg(err, "Could not create vendor"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Overlay title="Add vendor" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="small text-muted">The person must already have a Smitox account. They become a vendor immediately, without the application or payment flow.</p>
        <label className="form-label">Registered email or mobile</label>
        <input className="form-control mb-3" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <label className="form-label">Store name</label>
        <input className="form-control mb-3" maxLength={80} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
        <label className="form-label">Subscription</label>
        <PlanSelect plans={plans} value={form.planId} onChange={(planId) => setForm({ ...form, planId })} />
        <label className="form-label mt-3">Access expires after (days)</label>
        <input type="number" min="1" className="form-control" placeholder="Leave empty for no expiry" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create vendor"}</button>
        </div>
      </form>
    </Overlay>
  );
};

/* --------------------------- Vendor detail view --------------------------- */
const VendorDetail = ({ vendorId, plans, onClose, onChanged }) => {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({});
  const [priority, setPriority] = useState(0);
  const [grant, setGrant] = useState({ planId: COMPLIMENTARY, days: "" });
  const [slug, setSlug] = useState("");
  const [creds, setCreds] = useState({ email: "", mobile: "", password: "" });
  const [listings, setListings] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [listingQuery, setListingQuery] = useState({ page: 1, search: "", status: "" });
  const [busy, setBusy] = useState("");
  const [deleteListings, setDeleteListings] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await axios.get(`${API}/${vendorId}`);
      setData(d);
      const v = d.vendor;
      setProfile({
        storeName: v.storeName || "",
        businessName: v.businessName || "",
        businessCategory: v.businessCategory || "",
        businessDescription: v.businessDescription || "",
        primaryContactName: v.primaryContactName || "",
        primaryContactEmail: v.primaryContactEmail || "",
        primaryContactPhone: v.primaryContactPhone || "",
        commissionRate: v.commissionRate ?? 0,
        isVerified: !!v.isVerified,
        complianceNotes: v.complianceNotes || "",
      });
      setPriority(v.displayPriority || 0);
      setGrant({ planId: v.currentPlanId?._id || COMPLIMENTARY, days: "" });
      setSlug(v.storeSlug || "");
    } catch (err) {
      toast.error(errMsg(err, "Could not load vendor"));
    }
  }, [vendorId]);

  const loadListings = useCallback(async () => {
    try {
      const { data: d } = await axios.get(`${API}/${vendorId}/products`, {
        params: { page: listingQuery.page, limit: 10, search: listingQuery.search, status: listingQuery.status },
      });
      setListings(d);
    } catch (err) {
      toast.error(errMsg(err, "Could not load listings"));
    }
  }, [vendorId, listingQuery]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(loadListings, 300);
    return () => clearTimeout(t);
  }, [loadListings]);

  const run = async (key, fn, success) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast.success(success);
      await load();
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, "Action failed"));
    } finally {
      setBusy("");
    }
  };

  const updateCredentials = async () => {
    const payload = {};
    if (creds.email.trim()) payload.email = creds.email.trim();
    if (creds.mobile.trim()) payload.mobile = creds.mobile.trim();
    if (creds.password) payload.password = creds.password;
    if (Object.keys(payload).length === 0) return toast.error("Enter a new email, mobile or password");
    if (payload.password && payload.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!window.confirm("Change this vendor's login details?")) return;
    setBusy("creds");
    try {
      const { data: res } = await axios.put(`${API}/${vendorId}/credentials`, payload);
      toast.success(`Updated: ${(res.changed || []).join(", ")}`);
      setCreds({ email: "", mobile: "", password: "" });
      await load();
      onChanged();
    } catch (err) {
      toast.error(errMsg(err, "Could not update login details"));
    } finally {
      setBusy("");
    }
  };

  if (!data) {
    return (
      <Overlay title="Vendor" onClose={onClose} wide>
        <div className="text-center py-5"><div className="spinner-border" role="status" aria-label="Loading" /></div>
      </Overlay>
    );
  }

  const { vendor, application, listings: counts } = data;
  const visible = vendor.isActive && vendor.status === "active";
  const showOnHome = vendor.showOnHome !== false;
  const idDoc = docHref(application?.identityProofImage);
  const addrDoc = docHref(application?.addressProofImage);

  return (
    <Overlay title={vendor.storeName || "Vendor"} onClose={onClose} wide>
      {/* Summary */}
      <div className="d-flex flex-wrap gap-3 mb-4 small">
        <span className={`badge ${STATUS_BADGE[vendor.status] || "bg-secondary"}`}>{vendor.status}</span>
        {vendor.isVerified && <span className="badge bg-primary">Verified</span>}
        <span>Plan: <strong>{vendor.currentPlanId?.name || "-"}</strong> (expires {fmtDate(vendor.planExpiresAt)})</span>
        <span>Listings: <strong>{counts.active}</strong> active / {counts.total}</span>
        <span>Owner: {vendor.userId?.user_fullname || "-"} · {vendor.userId?.email_id || "-"} · {vendor.userId?.mobile_no || "-"}</span>
      </div>

      <div className="row g-4">
        {/* Controls */}
        <div className="col-lg-5">
          <section className="border rounded-3 p-3 mb-3">
            <h3 className="h6">Storefront</h3>
            {vendor.storeSlug ? (
              <p className="small mb-2">
                Public store:{" "}
                <a href={`/seller/${vendor.storeSlug}`} target="_blank" rel="noopener noreferrer">/seller/{vendor.storeSlug}</a>
              </p>
            ) : (
              <p className="small text-muted mb-2">No store URL yet.</p>
            )}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="small">{visible ? "Store and listings are visible" : "Store and listings are hidden"}</span>
              <button
                type="button"
                className={`btn btn-sm ${visible ? "btn-outline-danger" : "btn-success"}`}
                disabled={busy === "visibility"}
                onClick={() => run("visibility", () => axios.put(`${API}/${vendorId}/visibility`, { visible: !visible }), visible ? "Vendor hidden" : "Vendor visible")}
              >
                {visible ? "Hide vendor" : "Show vendor"}
              </button>
            </div>
            <label className="form-label small mb-1">Placement priority (0 = normal, higher shows first)</label>
            <div className="input-group input-group-sm">
              <input type="number" min="0" max="1000" className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)} />
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={busy === "priority"}
                onClick={() => run("priority", () => axios.put(`${API}/${vendorId}/priority`, { priority: parseInt(priority, 10) || 0 }), "Priority saved")}
              >
                Save
              </button>
            </div>
            <label className="form-label small mb-1 mt-3">Store URL</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text">/seller/</span>
              <input className="form-control" placeholder="store-url" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={busy === "slug"}
                onClick={() => run("slug", () => axios.put(`${API}/${vendorId}`, { storeSlug: slug.trim() }), "Store URL saved")}
              >
                Save
              </button>
            </div>
            <label className="form-check small mt-3">
              <input
                type="checkbox"
                className="form-check-input"
                checked={showOnHome}
                disabled={busy === "home"}
                onChange={(e) =>
                  run(
                    "home",
                    () => axios.put(`${API}/${vendorId}`, { showOnHome: e.target.checked }),
                    e.target.checked ? "Shown on home page" : "Hidden from home page"
                  )
                }
              />
              <span className="form-check-label">Show in Shop by seller on home page</span>
            </label>
          </section>

          <section className="border rounded-3 p-3 mb-3">
            <h3 className="h6">Subscription</h3>
            <p className="small text-muted mb-2">Grant or change the plan without payment. Pick “No subscription” for complimentary access with no listing limit.</p>
            <PlanSelect plans={plans} value={grant.planId} onChange={(planId) => setGrant({ ...grant, planId })} />
            <input type="number" min="1" className="form-control form-control-sm mt-2" placeholder="Expires after N days (empty = no expiry)" value={grant.days} onChange={(e) => setGrant({ ...grant, days: e.target.value })} />
            <button
              type="button"
              className="btn btn-sm btn-primary mt-2"
              disabled={busy === "grant"}
              onClick={() =>
                run(
                  "grant",
                  () => axios.post(`${API}/${vendorId}/grant-plan`, {
                    planId: grant.planId === COMPLIMENTARY ? null : grant.planId,
                    expiresInDays: grant.days ? Number(grant.days) : null,
                  }),
                  "Subscription updated"
                )
              }
            >
              Apply subscription
            </button>
            {application && (
              <div className="small mt-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="text-muted">Plan status:</span>
                  {application.planStatus ? (
                    <span className={`badge ${PLAN_STATUS_BADGE[application.planStatus] || "bg-secondary"}`}>
                      {application.planStatus.replace(/_/g, " ")}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </div>
                <div>Plan expiry: {fmtDate(application.planExpiryDate)}</div>
                <div>Grace ends: {fmtDate(application.gracePeriodEndDate)}</div>
              </div>
            )}
          </section>

          <section className="border rounded-3 p-3 mb-3">
            <h3 className="h6">Login credentials</h3>
            <p className="small text-muted mb-2">
              Current login: {vendor.userId?.email_id || "-"} · {vendor.userId?.mobile_no || "-"}
            </p>
            <label className="form-label small mb-0">New email</label>
            <input
              type="email"
              className="form-control form-control-sm mb-2"
              value={creds.email}
              onChange={(e) => setCreds({ ...creds, email: e.target.value })}
            />
            <label className="form-label small mb-0">New mobile</label>
            <input
              type="tel"
              className="form-control form-control-sm mb-2"
              value={creds.mobile}
              onChange={(e) => setCreds({ ...creds, mobile: e.target.value })}
            />
            <label className="form-label small mb-0">New password</label>
            <input
              type="password"
              minLength={8}
              className="form-control form-control-sm"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary mt-2"
              disabled={busy === "creds"}
              onClick={updateCredentials}
            >
              Update login
            </button>
          </section>

          <section className="border rounded-3 p-3 mb-3">
            <h3 className="h6">KYC &amp; address</h3>
            {application ? (
              <ul className="list-unstyled small mb-0">
                <li>Name: {application.firstName} {application.lastName}</li>
                <li>
                  ID: {application.identityProofType === "pan" ? "PAN" : "Aadhaar"} {application.identityProofNumber || "-"}{" "}
                  {idDoc ? <a href={idDoc} target="_blank" rel="noopener noreferrer">View document</a> : <span className="text-muted">(no document)</span>}
                </li>
                {addrDoc && <li><a href={addrDoc} target="_blank" rel="noopener noreferrer">Address proof</a></li>}
                <li>Address: {[application.addressLine1, application.addressLine2, application.city, application.state, application.pincode].filter(Boolean).join(", ") || "-"}</li>
                <li>Application: {application.status}{application.reviewNotes ? ` — ${application.reviewNotes}` : ""}</li>
              </ul>
            ) : (
              <p className="small text-muted mb-0">No application on file.</p>
            )}
          </section>

          <section className="border border-danger rounded-3 p-3">
            <h3 className="h6 text-danger">Remove vendor</h3>
            <p className="small mb-2">The account goes back to a normal customer. Listings are hidden (restored if they become a vendor again) unless you delete them.</p>
            <label className="form-check small mb-2">
              <input type="checkbox" className="form-check-input" checked={deleteListings} onChange={(e) => setDeleteListings(e.target.checked)} />
              <span className="form-check-label">Also permanently delete their listings</span>
            </label>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={busy === "remove"}
              onClick={async () => {
                if (!window.confirm(`Remove ${vendor.storeName || "this vendor"}?${deleteListings ? " Their listings will be deleted permanently." : ""}`)) return;
                setBusy("remove");
                try {
                  await axios.delete(`${API}/${vendorId}`, { params: { deleteListings: deleteListings ? "true" : "false" } });
                  toast.success("Vendor removed");
                  onChanged();
                  onClose();
                } catch (err) {
                  toast.error(errMsg(err, "Could not remove vendor"));
                  setBusy("");
                }
              }}
            >
              Remove vendor
            </button>
          </section>
        </div>

        {/* Profile + listings */}
        <div className="col-lg-7">
          <section className="border rounded-3 p-3 mb-3">
            <h3 className="h6">Profile</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run("profile", () => axios.put(`${API}/${vendorId}`, { ...profile, commissionRate: Number(profile.commissionRate) || 0 }), "Profile saved");
              }}
            >
              <div className="row g-2">
                {[
                  ["storeName", "Store name"],
                  ["businessName", "Business name"],
                  ["businessCategory", "Category"],
                  ["primaryContactName", "Contact name"],
                  ["primaryContactEmail", "Contact email"],
                  ["primaryContactPhone", "Contact phone"],
                ].map(([k, l]) => (
                  <div className="col-md-6" key={k}>
                    <label className="form-label small mb-0">{l}</label>
                    <input className="form-control form-control-sm" value={profile[k]} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
                  </div>
                ))}
                <div className="col-12">
                  <label className="form-label small mb-0">Description</label>
                  <textarea className="form-control form-control-sm" rows={2} value={profile.businessDescription} onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small mb-0">Commission %</label>
                  <input type="number" min="0" max="100" className="form-control form-control-sm" value={profile.commissionRate} onChange={(e) => setProfile({ ...profile, commissionRate: e.target.value })} />
                </div>
                <div className="col-md-8 d-flex align-items-end">
                  <label className="form-check small">
                    <input type="checkbox" className="form-check-input" checked={profile.isVerified} onChange={(e) => setProfile({ ...profile, isVerified: e.target.checked })} />
                    <span className="form-check-label">Verified vendor (KYC checked)</span>
                  </label>
                </div>
                <div className="col-12">
                  <label className="form-label small mb-0">Internal notes</label>
                  <input className="form-control form-control-sm" value={profile.complianceNotes} onChange={(e) => setProfile({ ...profile, complianceNotes: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-sm btn-primary mt-3" disabled={busy === "profile"}>Save profile</button>
            </form>
          </section>

          <section className="border rounded-3 p-3">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Listings ({listings.total})</h3>
              <div className="d-flex gap-2">
                <input className="form-control form-control-sm" placeholder="Search" value={listingQuery.search} onChange={(e) => setListingQuery({ page: 1, search: e.target.value, status: listingQuery.status })} />
                <select className="form-select form-select-sm" value={listingQuery.status} onChange={(e) => setListingQuery({ ...listingQuery, page: 1, status: e.target.value })}>
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-sm align-middle small mb-2">
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {listings.products.length === 0 && (
                    <tr><td colSpan={5} className="text-muted text-center py-3">No listings</td></tr>
                  )}
                  {listings.products.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="fw-semibold">{p.name}</div>
                        <div className="text-muted">{p.category?.name || ""}</div>
                      </td>
                      <td>{money(p.perPiecePrice)}</td>
                      <td>{p.stock ?? "-"}</td>
                      <td>
                        {p.isActive === "1" ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">{p.adminHold ? "Held" : "Inactive"}</span>}
                      </td>
                      <td className="text-nowrap">
                        <Link className="btn btn-link btn-sm p-0 me-2" to={`/dashboard/admin/product/${p.slug}`}>Edit</Link>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 me-2"
                          onClick={async () => {
                            try {
                              await axios.put(`/api/v1/product/updateStatus/products/${p._id}`, { isActive: p.isActive === "1" ? "0" : "1" });
                              loadListings();
                            } catch (err) {
                              toast.error(errMsg(err, "Could not change status"));
                            }
                          }}
                        >
                          {p.isActive === "1" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-danger"
                          onClick={async () => {
                            if (!window.confirm(`Delete "${p.name}"?`)) return;
                            try {
                              await axios.delete(`/api/v1/product/delete-product/${p._id}`);
                              toast.success("Listing deleted");
                              loadListings();
                              load();
                            } catch (err) {
                              toast.error(errMsg(err, "Could not delete"));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {listings.pages > 1 && (
              <div className="d-flex justify-content-end align-items-center gap-2 small">
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={listingQuery.page <= 1} onClick={() => setListingQuery({ ...listingQuery, page: listingQuery.page - 1 })}>Prev</button>
                <span>Page {listings.page} of {listings.pages}</span>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={listingQuery.page >= listings.pages} onClick={() => setListingQuery({ ...listingQuery, page: listingQuery.page + 1 })}>Next</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </Overlay>
  );
};

/* ------------------------------- List page ------------------------------- */
const Vendors = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState({ page: 1, search: "", status: "", plan: "" });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, { params: { ...query, limit: 20 } });
      setRows(data.vendors || []);
      setMeta({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      toast.error(errMsg(err, "Could not load vendors"));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(fetchVendors, 300);
    return () => clearTimeout(t);
  }, [fetchVendors]);

  useEffect(() => {
    axios
      .get("/api/v1/subscription-plans/admin/list")
      .then(({ data }) => setPlans((data.plans || []).filter((p) => p.name !== "Admin Complimentary")))
      .catch(() => setPlans([]));
  }, []);

  return (
    <Layout title="Vendors - Admin">
      <AdminMenu />
      <div className="container-fluid dashboard p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-0">Vendors</h1>
            <small className="text-muted">{meta.total} vendors · new applications are reviewed in <Link to="/dashboard/admin/sellers/applications">Seller Applications</Link></small>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-primary" to="/dashboard/admin/vendors/report">Subscription report</Link>
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>+ Add vendor</button>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <input className="form-control" placeholder="Search store, name, email or phone" value={query.search} onChange={(e) => setQuery({ ...query, page: 1, search: e.target.value })} />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={query.status} onChange={(e) => setQuery({ ...query, page: 1, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Hidden</option>
              <option value="suspended">Suspended</option>
              <option value="expired_payment_failed">Payment failed</option>
            </select>
          </div>
          <div className="col-6 col-md-4">
            <select className="form-select" value={query.plan} onChange={(e) => setQuery({ ...query, page: 1, plan: e.target.value })}>
              <option value="">All plans</option>
              {plans.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-responsive bg-white rounded-3 border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr><th>Store</th><th>Owner</th><th>Plan</th><th>Listings</th><th>Priority</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" /></td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No vendors found</td></tr>
              )}
              {!loading && rows.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div className="fw-semibold">{v.storeName || v.businessName || "-"} {v.isVerified && <span className="badge bg-primary ms-1">Verified</span>}</div>
                    <div className="small text-muted">{v.businessCategory || ""}</div>
                    {v.storeSlug && (
                      <div className="small">
                        <a href={`/seller/${v.storeSlug}`} target="_blank" rel="noopener noreferrer">/seller/{v.storeSlug}</a>
                      </div>
                    )}
                  </td>
                  <td className="small">
                    <div>{v.userId?.user_fullname || v.primaryContactName || "-"}</div>
                    <div className="text-muted">{v.userId?.email_id || v.primaryContactEmail || ""}</div>
                  </td>
                  <td className="small">
                    <div>{v.currentPlanId?.name || "-"}</div>
                    <div className="text-muted">{fmtDate(v.planExpiresAt)}</div>
                  </td>
                  <td className="small">{v.listings.active} / {v.listings.total}</td>
                  <td className="small">{v.displayPriority || 0}</td>
                  <td><span className={`badge ${STATUS_BADGE[v.status] || "bg-secondary"}`}>{v.status === "inactive" ? "hidden" : v.status}</span></td>
                  <td><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setOpenId(v._id)}>Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta.pages > 1 && (
          <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: query.page - 1 })}>Prev</button>
            <span className="small">Page {meta.page} of {meta.pages}</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={query.page >= meta.pages} onClick={() => setQuery({ ...query, page: query.page + 1 })}>Next</button>
          </div>
        )}
      </div>

      {openId && <VendorDetail vendorId={openId} plans={plans} onClose={() => setOpenId(null)} onChanged={fetchVendors} />}
      {adding && (
        <AddVendor
          plans={plans}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            fetchVendors();
          }}
        />
      )}
    </Layout>
  );
};

export default Vendors;
