import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";

// Subscription overview for every vendor: plan state, grace periods, payments and
// the money that actually moved. Read-only; no changes are made from this page.

const API = "/api/v1/admin/vendors/subscriptions/report";
const errMsg = (e, fallback) => e?.response?.data?.message || fallback;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "No expiry");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const PLAN_STATUS_BADGE = {
  active: "bg-success",
  expiring_soon: "bg-warning text-dark",
  grace_period: "bg-warning text-dark",
  expired: "bg-danger",
};
const PAYMENT_TYPE = {
  initial_activation: "New",
  manual_renewal: "Renewal",
  upgrade: "Upgrade",
};
const FILTERS = [
  { value: "", label: "All" },
  { value: "expiring", label: "Expiring in 7 days" },
  { value: "grace", label: "Grace period" },
  { value: "expired", label: "Expired" },
  { value: "paid", label: "Paid plans" },
  { value: "pending", label: "Pending payment" },
];

const expiryNote = (v) => {
  if (!v.expiresAt || typeof v.daysLeft !== "number") return "";
  if (v.daysLeft > 0) return `${v.daysLeft} days left`;
  if (v.daysLeft === 0) return "expires today";
  return `expired ${Math.abs(v.daysLeft)} days ago`;
};

// RFC 4180 style escaping so commas, quotes and newlines survive a spreadsheet import.
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const VendorSubscriptionReport = () => {
  const [report, setReport] = useState(null);
  const [range, setRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchReport = useCallback(async (from = "", to = "") => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await axios.get(API, { params });
      setReport(data);
    } catch (err) {
      toast.error(errMsg(err, "Could not load subscription report"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const vendors = report?.vendors || [];
  const payments = report?.payments || [];
  const summary = report?.summary || {};

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (filter === "expiring" && !(typeof v.daysLeft === "number" && v.daysLeft >= 0 && v.daysLeft <= 7)) return false;
      if (filter === "grace" && v.planStatus !== "grace_period") return false;
      if (filter === "expired" && v.planStatus !== "expired") return false;
      if (filter === "paid" && (!v.plan || v.plan.isFree)) return false;
      if (filter === "pending" && !v.pendingPayment) return false;
      if (!q) return true;
      return [v.storeName, v.owner, v.email]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [vendors, filter, search]);

  const paymentsTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const tiles = [
    { label: "Vendors", value: summary.vendors ?? 0 },
    { label: "Active", value: summary.active ?? 0 },
    { label: "Paid plans", value: summary.paidPlans ?? 0 },
    { label: "Expiring in 7 days", value: summary.expiringIn7Days ?? 0 },
    { label: "In grace period", value: summary.inGracePeriod ?? 0 },
    { label: "Expired", value: summary.expired ?? 0 },
    { label: "Pending payments", value: summary.pendingPayments ?? 0 },
    { label: "Revenue", value: money(summary.revenue), sub: `${summary.paymentsCount || 0} payments` },
  ];

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const storeUrl = (slug) => (slug ? `${window.location.origin}/seller/${slug}` : "");

    downloadCsv(
      `vendor-subscriptions-${stamp}.csv`,
      [
        "Store",
        "Store URL",
        "Owner",
        "Email",
        "Mobile",
        "Plan",
        "Plan price",
        "Billing cycle",
        "Plan status",
        "Expires",
        "Days left",
        "Grace ends",
        "Total paid",
        "Payments count",
        "Last payment",
        "Listings active",
        "Listings total",
        "Store status",
        "On home",
      ],
      filtered.map((v) => [
        v.storeName || "",
        storeUrl(v.storeSlug),
        v.owner || "",
        v.email || "",
        v.mobile || "",
        v.plan?.name || "",
        v.plan ? Number(v.plan.price || 0) : "",
        v.plan?.billingCycle || "",
        v.planStatus || "",
        v.expiresAt ? fmtDate(v.expiresAt) : "",
        typeof v.daysLeft === "number" ? v.daysLeft : "",
        v.graceEndsAt ? fmtDate(v.graceEndsAt) : "",
        Number(v.totalPaid || 0),
        v.paymentsCount || 0,
        v.lastPaymentAt ? fmtDate(v.lastPaymentAt) : "",
        v.listings?.active ?? 0,
        v.listings?.total ?? 0,
        v.storeStatus || "",
        v.showOnHome ? "Yes" : "No",
      ])
    );

    downloadCsv(
      `vendor-subscription-payments-${stamp}.csv`,
      ["Date", "Store", "Vendor ID", "Type", "Plan", "Amount", "Payment ID"],
      payments.map((p) => [
        p.at ? fmtDate(p.at) : "",
        p.storeName || "",
        p.vendorId || "",
        PAYMENT_TYPE[p.type] || p.type || "",
        p.plan || "",
        Number(p.amount || 0),
        p.paymentId || "",
      ])
    );
  };

  return (
    <Layout title="Vendor Subscription Report - Admin">
      <AdminMenu />
      <div className="container-fluid dashboard p-3 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-0">Vendor subscriptions</h1>
            <small className="text-muted">Plans, renewals, grace periods and payments</small>
          </div>
          <Link className="btn btn-outline-secondary" to="/dashboard/admin/vendors">Back to vendors</Link>
        </div>

        <div className="row g-2 align-items-end mb-3">
          <div className="col-6 col-md-3">
            <label className="form-label small mb-1">From</label>
            <input type="date" className="form-control" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small mb-1">To</label>
            <input type="date" className="form-control" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          </div>
          <div className="col-12 col-md-3">
            <button type="button" className="btn btn-primary" disabled={loading} onClick={() => fetchReport(range.from, range.to)}>Apply</button>
          </div>
          <div className="col-12 col-md-3 text-md-end">
            <button type="button" className="btn btn-outline-primary" disabled={loading || !report} onClick={exportCsv}>Export CSV</button>
          </div>
        </div>

        <div className="row g-2 mb-4">
          {tiles.map((t) => (
            <div className="col-6 col-md-3 col-xl-3" key={t.label}>
              <div className="border rounded-3 p-3 h-100">
                <div className="small text-muted">{t.label}</div>
                <div className="h5 mb-0">{t.value}</div>
                {t.sub && <div className="small text-muted">{t.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Search store, owner or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <section className="border rounded-3 p-3 mb-4">
          <h3 className="h6">Vendors ({filtered.length})</h3>
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Store</th>
                  <th>Owner</th>
                  <th>Plan</th>
                  <th>Plan status</th>
                  <th>Expires</th>
                  <th>Grace ends</th>
                  <th>Total paid</th>
                  <th>Payments</th>
                  <th>Last payment</th>
                  <th>Listings</th>
                  <th>Store status</th>
                  <th>On home</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={12} className="text-center py-4"><div className="spinner-border spinner-border-sm" role="status" aria-label="Loading" /></td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={12} className="text-center text-muted py-4">No vendors found</td></tr>
                )}
                {!loading && filtered.map((v) => (
                  <tr key={v.vendorId}>
                    <td>
                      {v.storeSlug ? (
                        <a href={`/seller/${v.storeSlug}`} target="_blank" rel="noopener noreferrer">{v.storeName || v.storeSlug}</a>
                      ) : (
                        <span>{v.storeName || "-"}</span>
                      )}
                      {v.storeSlug && <div className="text-muted">/seller/{v.storeSlug}</div>}
                      {v.pendingPayment && (
                        <span className="badge bg-warning text-dark mt-1">Payment pending: {money(v.pendingPayment.amount)}</span>
                      )}
                    </td>
                    <td>
                      <div>{v.owner || "-"}</div>
                      <div className="text-muted">{v.email || ""}</div>
                      <div className="text-muted">{v.mobile || ""}</div>
                    </td>
                    <td>
                      {v.plan ? (
                        <>
                          <div>{v.plan.name}</div>
                          <div className="text-muted">{v.plan.isFree ? "Free" : `${money(v.plan.price)}/${v.plan.billingCycle}`}</div>
                        </>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${PLAN_STATUS_BADGE[v.planStatus] || "bg-secondary"}`}>
                        {(v.planStatus || "-").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div>{fmtDate(v.expiresAt)}</div>
                      {expiryNote(v) && <div className="text-muted">{expiryNote(v)}</div>}
                    </td>
                    <td>{fmtDate(v.graceEndsAt)}</td>
                    <td>{money(v.totalPaid)}</td>
                    <td>{v.paymentsCount || 0}</td>
                    <td>{v.lastPaymentAt ? fmtDate(v.lastPaymentAt) : "-"}</td>
                    <td>{v.listings?.active ?? 0} / {v.listings?.total ?? 0}</td>
                    <td>{v.storeStatus || "-"}</td>
                    <td>{v.showOnHome ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border rounded-3 p-3">
          <h3 className="h6">Subscription payments</h3>
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle small mb-0">
              <thead className="table-light">
                <tr><th>Date</th><th>Store</th><th>Type</th><th>Plan</th><th>Amount</th><th>Payment ID</th></tr>
              </thead>
              <tbody>
                {!loading && payments.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No payments in this range</td></tr>
                )}
                {payments.map((p, i) => (
                  <tr key={p.paymentId || i}>
                    <td>{fmtDate(p.at)}</td>
                    <td>{p.storeName || "-"}</td>
                    <td>{PAYMENT_TYPE[p.type] || p.type || "-"}</td>
                    <td>{p.plan || "-"}</td>
                    <td>{money(p.amount)}</td>
                    <td className="text-muted">{p.paymentId || "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-semibold">
                  <td colSpan={4}>Total</td>
                  <td>{money(paymentsTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default VendorSubscriptionReport;
