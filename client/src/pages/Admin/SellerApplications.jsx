import {
  AlertCircle,
  Ban,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import {
  approveApplication,
  deleteApplication,
  getApplicationById,
  getSellerApplications,
  rejectApplication,
  requestReupload,
  suspendSeller,
} from "../../services/sellerApi";
import "./sellerApplications.css";

// Stored upload paths are relative ("uploads/sellers/x.jpg"); make them root-absolute
// so they don't resolve against the admin page URL.
const docUrl = (p) => (!p ? null : /^(https?:)?\/\//.test(p) || p.startsWith("/") ? p : `/${p}`);
const APPROVABLE = ["submitted", "under_review", "rejected", "reupload_requested"];
const REJECTABLE = ["submitted", "under_review", "reupload_requested", "approved_pending_payment", "approved_payment_failed"];
const UNDELETABLE = ["approved", "approved_pending_payment", "active"];
const SORT_OPTIONS = [
  ["-createdAt", "Newest first"],
  ["createdAt", "Oldest first"],
  ["-submittedAt", "Recently submitted"],
  ["-reviewedAt", "Recently reviewed"],
  ["firstName", "Name (A-Z)"],
  ["-firstName", "Name (Z-A)"],
  ["businessName", "Business (A-Z)"],
  ["status", "Status"],
];

const SellerApplications = () => {
  const [auth] = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: "submitted",
    search: "",
    sort: "-createdAt",
  });
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [reuploadReason, setReuploadReason] = useState("");
  const [reuploadFields, setReuploadFields] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await getSellerApplications(
          {
            status: filters.status,
            page: pagination.page,
            limit: pagination.limit,
            search: filters.search,
            sort: filters.sort,
          },
          auth?.token
        );

        if (response.success) {
          setApplications(response.applications || []);
          setPagination(response.pagination);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load applications");
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchApplications();
    }
  }, [filters, pagination.page, auth?.token, reloadKey]);

  const errorText = (err, fallback) => err?.message || err?.error || fallback;

  // Sort by clicking a column header: toggles asc/desc on that field
  const toggleSort = (field) => {
    setFilters((prev) => ({ ...prev, sort: prev.sort === `-${field}` ? field : `-${field}` }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  const sortIcon = (field) =>
    filters.sort === field ? " ▲" : filters.sort === `-${field}` ? " ▼" : "";

  const handleDelete = async (app) => {
    if (UNDELETABLE.includes(app.status)) {
      setError("Approved sellers can't be deleted. Suspend them first.");
      return;
    }
    const name = `${app.firstName || ""} ${app.lastName || ""}`.trim() || app.email || "this applicant";
    if (!window.confirm(`Delete the application from ${name}? This cannot be undone.`)) return;
    try {
      setActionLoading(true);
      setError("");
      const response = await deleteApplication(app._id, auth?.token);
      if (response.success) {
        if (selectedApp?._id === app._id) setShowDrawer(false);
        setReloadKey((k) => k + 1);
      } else {
        setError(response.message || "Failed to delete application");
      }
    } catch (err) {
      setError(errorText(err, "Failed to delete application"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view application
  const handleViewApplication = async (appId) => {
    try {
      setLoading(true);
      const response = await getApplicationById(appId, auth?.token);

      if (response.success) {
        setSelectedApp(response.application);
        setShowDrawer(true);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load application");
      setLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError("");

      console.log("Approving application:", selectedApp._id);
      const response = await approveApplication(
        selectedApp._id,
        approveNotes,
        auth?.token
      );

      console.log("Approve response:", response);

      if (response.success) {
        // Refresh applications list
        setApplications((prev) =>
          prev.filter((app) => app._id !== selectedApp._id)
        );
        setShowDrawer(false);
        setShowApproveModal(false);
        setApproveNotes("");

        // Show success message
        alert("Application approved successfully!");
      } else {
        setError(response.message || "Failed to approve application");
      }

      setActionLoading(false);
    } catch (err) {
      console.error("Approve error:", err);
      setError(errorText(err, "Failed to approve application"));
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async (reason = rejectReason) => {
    if (!reason || !reason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      console.log("Rejecting application:", selectedApp._id);
      const response = await rejectApplication(
        selectedApp._id,
        reason,
        auth?.token
      );

      console.log("Reject response:", response);

      if (response.success) {
        // Refresh applications list
        setApplications((prev) =>
          prev.filter((app) => app._id !== selectedApp._id)
        );
        setShowDrawer(false);
        setShowRejectModal(false);
        setRejectReason("");

        // Show success message
        alert("Application rejected successfully!");
      } else {
        setError(response.message || "Failed to reject application");
      }

      setActionLoading(false);
    } catch (err) {
      console.error("Reject error:", err);
      setError(errorText(err, "Failed to reject application"));
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      submitted: "badge-blue",
      under_review: "badge-blue",
      approved_pending_payment: "badge-warning",
      approved_payment_failed: "badge-danger",
      approved: "badge-success",
      rejected: "badge-danger",
      active: "badge-success",
      suspended: "badge-danger",
      reupload_requested: "badge-warning",
    };

    return (
      <span className={`badge ${badges[status] || "badge-gray"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  // Handle suspend seller
  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      setError("Please provide a suspension reason");
      return;
    }
    try {
      setActionLoading(true);
      setError("");
      const response = await suspendSeller(selectedApp._id, suspendReason, auth?.token);
      if (response.success) {
        setApplications(prev => prev.filter(app => app._id !== selectedApp._id));
        setShowDrawer(false);
        setShowSuspendModal(false);
        setSuspendReason("");
        alert("Seller suspended successfully!");
      } else {
        setError(response.message || "Failed to suspend seller");
      }
      setActionLoading(false);
    } catch (err) {
      setError(err.message || "Failed to suspend seller");
      setActionLoading(false);
    }
  };

  // Handle request re-upload
  const handleRequestReupload = async () => {
    if (!reuploadReason.trim()) {
      setError("Please provide a reason for re-upload request");
      return;
    }
    try {
      setActionLoading(true);
      setError("");
      const response = await requestReupload(
        selectedApp._id,
        { reason: reuploadReason, fields: reuploadFields },
        auth?.token
      );
      if (response.success) {
        setApplications(prev => prev.filter(app => app._id !== selectedApp._id));
        setShowDrawer(false);
        setShowReuploadModal(false);
        setReuploadReason("");
        setReuploadFields([]);
        alert("Re-upload requested successfully!");
      } else {
        setError(response.message || "Failed to request re-upload");
      }
      setActionLoading(false);
    } catch (err) {
      setError(err.message || "Failed to request re-upload");
      setActionLoading(false);
    }
  };

  // Render table
  const renderTable = () => (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th role="button" onClick={() => toggleSort("firstName")}>Applicant{sortIcon("firstName")}</th>
            <th role="button" onClick={() => toggleSort("businessName")}>Business{sortIcon("businessName")}</th>
            <th>Plan</th>
            <th role="button" onClick={() => toggleSort("createdAt")}>Submitted{sortIcon("createdAt")}</th>
            <th role="button" onClick={() => toggleSort("status")}>Status{sortIcon("status")}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app._id}>
              <td>
                <div className="applicant-info">
                  <div className="applicant-name">
                    {app.firstName} {app.lastName}
                  </div>
                  <div className="applicant-email">{app.email}</div>
                </div>
              </td>
              <td>{app.storeName || app.businessName || "-"}</td>
              <td>
                <strong>
                  {app.selectedPlanSnapshot?.name ||
                    app.selectedPlanId?.name ||
                    "No Plan"}
                </strong>
              </td>
              <td>
                {new Date(app.submittedAt || app.createdAt).toLocaleDateString("en-IN")}
              </td>
              <td>{getStatusBadge(app.status)}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleViewApplication(app._id)}
                >
                  <Eye size={16} />
                  View
                </button>
                {!UNDELETABLE.includes(app.status) && (
                  <button
                    className="btn btn-sm btn-outline ms-2 text-danger"
                    onClick={() => handleDelete(app)}
                    disabled={actionLoading}
                    title="Delete application"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render drawer (side panel)
  const renderDrawer = () => (
    <div className={`drawer ${showDrawer ? "open" : ""}`}>
      <div className="drawer-header">
        <h2>Application Details</h2>
        <button
          className="btn-close"
          onClick={() => setShowDrawer(false)}
        >
          ✕
        </button>
      </div>

      {selectedApp && (
        <div className="drawer-body">
          {/* Personal Info */}
          <div className="section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>
                  {selectedApp.firstName} {selectedApp.lastName}
                </p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p className="flex-center">
                  <Mail size={16} />
                  {selectedApp.email}
                </p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p className="flex-center">
                  <Phone size={16} />
                  {selectedApp.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="section">
            <h3>Address Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Address</label>
                <p className="flex-center">
                  <MapPin size={16} />
                  {selectedApp.addressLine1}
                  {selectedApp.addressLine2 && `, ${selectedApp.addressLine2}`}
                </p>
              </div>
              <div className="info-item">
                <label>City, State, Pincode</label>
                <p>
                  {selectedApp.city}, {selectedApp.state} {selectedApp.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="section">
            <h3>Business Information</h3>
            <div className="info-grid">
              {selectedApp.storeName && (
                <div className="info-item">
                  <label>Store Name</label>
                  <p>{selectedApp.storeName}</p>
                </div>
              )}
              <div className="info-item">
                <label>Business Name</label>
                <p className="flex-center">
                  <Briefcase size={16} />
                  {selectedApp.businessName || selectedApp.legalBusinessName || "N/A"}
                </p>
              </div>
              <div className="info-item">
                <label>Business Type</label>
                <p>{(selectedApp.businessType || "").replace(/_/g, " ")}</p>
              </div>
              {selectedApp.businessCategory && (
                <div className="info-item">
                  <label>Category</label>
                  <p>{selectedApp.businessCategory}</p>
                </div>
              )}
              <div className="info-item">
                <label>GST Number</label>
                <p>{selectedApp.gstNumber || (selectedApp.gstExemptionDeclared ? "GST Exempt (Declared)" : "Not Provided")}</p>
              </div>
              <div className="info-item">
                <label>PAN Number</label>
                <p>{selectedApp.panNumber || "Not Provided"}</p>
              </div>
              {selectedApp.identityProofType === "aadhar" && (
                <div className="info-item">
                  <label>Aadhaar Number</label>
                  <p>{selectedApp.identityProofNumber || "Not Provided"}</p>
                </div>
              )}
            </div>
            {selectedApp.businessDescription && (
              <div className="info-item">
                <label>Description</label>
                <p>{selectedApp.businessDescription}</p>
              </div>
            )}
          </div>

          {/* Banking Info */}
          <div className="section">
            <h3>Banking Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Account Holder</label>
                <p>{selectedApp.accountHolderName}</p>
              </div>
              <div className="info-item">
                <label>Account Number</label>
                <p>{selectedApp.accountNumber}</p>
              </div>
              <div className="info-item">
                <label>IFSC Code</label>
                <p>{selectedApp.ifscCode}</p>
              </div>
              <div className="info-item">
                <label>Bank Name</label>
                <p>{selectedApp.bankName}</p>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="section">
            <h3>Plan Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Selected Plan</label>
                <p>
                  {selectedApp.selectedPlanSnapshot?.name ||
                    selectedApp.selectedPlanId?.name ||
                    "No Plan"}
                </p>
              </div>
              <div className="info-item">
                <label>Price</label>
                <p>
                  {(selectedApp.selectedPlanSnapshot?.isFree || selectedApp.selectedPlanId?.isFree)
                    ? "Free"
                    : `₹${selectedApp.selectedPlanSnapshot?.price || selectedApp.selectedPlanId?.price}`}
                </p>
              </div>
              <div className="info-item">
                <label>Status</label>
                <p>{getStatusBadge(selectedApp.status)}</p>
              </div>
            </div>
          </div>

          {/* Review Notes */}
          {selectedApp.reviewNotes && (
            <div className="section">
              <h3>Review Notes</h3>
              <p className="review-notes">{selectedApp.reviewNotes}</p>
            </div>
          )}

          {/* Documents with Preview */}
          <div className="section">
            <h3>Uploaded Documents</h3>
            <div className="documents-grid">
              {[
                { label: selectedApp.identityProofType === "aadhar" ? "Aadhaar Card" : "Identity Proof", type: selectedApp.identityProofType, file: selectedApp.identityProofImage },
                { label: "Address Proof", type: selectedApp.addressProofType, file: selectedApp.addressProofImage },
                { label: "GST Certificate", file: selectedApp.gstImage },
                { label: "PAN Card", file: selectedApp.panImage },
                { label: "Cancelled Cheque", file: selectedApp.cancelledCheckImage },
              ].map(
                (doc, idx) =>
                  doc.file && (
                    <div key={idx} className="document-card">
                      <div className="document-preview" onClick={() => setPreviewImage(docUrl(doc.file))}>
                        {doc.file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={docUrl(doc.file)} alt={doc.label} />
                        ) : (
                          <div className="doc-icon"><FileText size={32} /></div>
                        )}
                      </div>
                      <div className="document-info">
                        <span className="doc-label">{doc.label}</span>
                        {doc.type && <span className="doc-type">{doc.type.replace(/_/g, " ")}</span>}
                      </div>
                      <a href={docUrl(doc.file)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                        <Eye size={14} /> Open
                      </a>
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Image Preview Lightbox */}
          {previewImage && (
            <div className="image-lightbox" onClick={() => setPreviewImage(null)}>
              <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                <button className="btn-close lightbox-close" onClick={() => setPreviewImage(null)}>✕</button>
                <img src={previewImage} alt="Document Preview" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="drawer-footer">
        {selectedApp?.status === "rejected" && (
          <div className="alert alert-warning w-100 mb-2">
            <AlertCircle size={16} />
            <span>
              Rejected{selectedApp.reviewNotes ? `: ${selectedApp.reviewNotes}` : ""}. The applicant can fix and
              resubmit, or you can approve it now if the rejection was a mistake.
            </span>
          </div>
        )}
        {["submitted", "under_review"].includes(selectedApp?.status) && (
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setShowReuploadModal(true)}
            disabled={actionLoading}
          >
            <RotateCcw size={16} />
            Request Re-upload
          </button>
        )}
        {REJECTABLE.includes(selectedApp?.status) && (
          <button
            className="btn btn-danger"
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
          >
            <X size={18} />
            Reject
          </button>
        )}
        {APPROVABLE.includes(selectedApp?.status) && (
          <button
            className="btn btn-success"
            onClick={() => setShowApproveModal(true)}
            disabled={actionLoading}
          >
            <Check size={18} />
            Approve
          </button>
        )}
        {selectedApp && !UNDELETABLE.includes(selectedApp.status) && (
          <button
            className="btn btn-outline text-danger"
            onClick={() => handleDelete(selectedApp)}
            disabled={actionLoading}
          >
            <Trash2 size={18} />
            Delete
          </button>
        )}
        {(selectedApp?.status === "approved" || selectedApp?.status === "active") && (
          <button
            className="btn btn-danger"
            onClick={() => setShowSuspendModal(true)}
            disabled={actionLoading}
          >
            <Ban size={18} />
            Suspend Seller
          </button>
        )}
        {selectedApp && !["submitted", "under_review", "approved", "active", "rejected", "reupload_requested"].includes(selectedApp.status) && (
          <div className="alert alert-info">
            <AlertCircle size={16} />
            <span>This application status is: {selectedApp.status.replace(/_/g, " ")}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Render approve modal
  const renderApproveModal = () => (
    <div className={`modal ${showApproveModal ? "show" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Approve Application</h2>
          <button
            className="btn-close"
            onClick={() => setShowApproveModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Review Notes (Optional)</label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Add any notes for the applicant..."
              rows="4"
              className="form-control"
            />
          </div>

          {(selectedApp?.selectedPlanId?.isFree ?? selectedApp?.selectedPlanSnapshot?.isFree) ? (
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <span>
                This is a Free plan. The seller will be activated immediately
                upon approval.
              </span>
            </div>
          ) : (
            <div className="alert alert-warning">
              <AlertCircle size={20} />
              <span>
                This is a Paid plan. A payment order will be created and sent
                to the applicant.
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowApproveModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <>
                <Loader size={18} className="spinner-small" />
                Approving...
              </>
            ) : (
              <>
                <Check size={18} />
                Approve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render reject modal
  const renderRejectModal = () => (
    <div className={`modal ${showRejectModal ? "show" : ""}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Reject Application</h2>
          <button
            className="btn-close"
            onClick={() => setShowRejectModal(false)}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Rejection Reason *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
              rows="4"
              className="form-control"
              required
            />
          </div>

          <div className="alert alert-warning">
            <AlertCircle size={20} />
            <span>
              The applicant will see this reason and can reapply after making
              corrections.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowRejectModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? (
              <>
                <Loader size={18} className="spinner-small" />
                Rejecting...
              </>
            ) : (
              <>
                <X size={18} />
                Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container-fluid mt-4">
        <div className="page-header mb-4">
          <h1>Seller Applications</h1>
          <p>Review and manage seller applications</p>
        </div>

        {error && (
          <div className="alert alert-danger mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section mb-4">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="form-control"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved_pending_payment">Approved (Payment Pending)</option>
              <option value="approved_payment_failed">Approved (Payment Failed)</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="reupload_requested">Re-upload Requested</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by</label>
            <select
              value={filters.sort}
              onChange={(e) => {
                setFilters({ ...filters, sort: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="form-control"
            >
              {SORT_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <div className="search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or business..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-5">
            <Loader className="spinner" />
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="alert alert-info">
            <AlertCircle size={20} />
            <span>No applications found</span>
          </div>
        ) : (
          <>
            {renderTable()}

            {/* Pagination */}
            <div className="pagination-section">
              <div className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} applications
              </div>

              <div className="pagination">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.max(1, pagination.page - 1),
                    })
                  }
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`btn btn-sm ${pagination.page === page
                          ? "btn-primary"
                          : "btn-outline"
                        }`}
                      onClick={() =>
                        setPagination({ ...pagination, page })
                      }
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.min(pagination.pages, pagination.page + 1),
                    })
                  }
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Drawer */}
        {renderDrawer()}

        {/* Modals */}
        {renderApproveModal()}
        {renderRejectModal()}

        {/* Suspend Modal */}
        {showSuspendModal && (
          <div className="modal show">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Suspend Seller</h2>
                <button className="btn-close" onClick={() => setShowSuspendModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Suspension Reason *</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Explain why this seller is being suspended..."
                    rows="4"
                    className="form-control"
                    required
                  />
                </div>
                <div className="alert alert-danger">
                  <AlertCircle size={20} />
                  <span>This will immediately revoke seller access and deactivate their account.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSuspendModal(false)} disabled={actionLoading}>Cancel</button>
                <button className="btn btn-danger" onClick={handleSuspend} disabled={actionLoading || !suspendReason.trim()}>
                  {actionLoading ? <><Loader size={18} className="spinner-small" /> Suspending...</> : <><Ban size={18} /> Suspend Seller</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Re-upload Modal */}
        {showReuploadModal && (
          <div className="modal show">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Request Document Re-upload</h2>
                <button className="btn-close" onClick={() => setShowReuploadModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Reason for Re-upload *</label>
                  <textarea
                    value={reuploadReason}
                    onChange={(e) => setReuploadReason(e.target.value)}
                    placeholder="Explain what needs to be corrected or re-uploaded..."
                    rows="4"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fields to Re-upload (Select all that apply)</label>
                  <div className="checkbox-group">
                    {["identityProofImage", "addressProofImage", "gstImage", "panImage", "cancelledCheckImage", "gstNumber", "panNumber"].map(field => (
                      <label key={field} className="form-check">
                        <input
                          type="checkbox"
                          checked={reuploadFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setReuploadFields(prev => [...prev, field]);
                            } else {
                              setReuploadFields(prev => prev.filter(f => f !== field));
                            }
                          }}
                        />
                        <span>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="alert alert-warning">
                  <AlertCircle size={20} />
                  <span>The seller will be notified and can edit and resubmit their application.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowReuploadModal(false)} disabled={actionLoading}>Cancel</button>
                <button className="btn btn-warning" onClick={handleRequestReupload} disabled={actionLoading || !reuploadReason.trim()}>
                  {actionLoading ? <><Loader size={18} className="spinner-small" /> Requesting...</> : <><RotateCcw size={18} /> Request Re-upload</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay */}
        {(showDrawer || showApproveModal || showRejectModal || showSuspendModal || showReuploadModal) && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowDrawer(false);
              setShowApproveModal(false);
              setShowRejectModal(false);
              setShowSuspendModal(false);
              setShowReuploadModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default SellerApplications;
