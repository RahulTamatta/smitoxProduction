import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
import { NOTE_CONDITIONS } from "../../hooks/useCartNotices";
import api from "../../services/api";
import "./AppContent.css";

const fields = [
  { key: "whatsappNumber", label: "WhatsApp API number", placeholder: "+91 9876543210", type: "tel" },
  { key: "businessEmail", label: "Business email", placeholder: "support@example.com", type: "email" },
  { key: "gstNumber", label: "GST number", placeholder: "27AAACP0123M1Z5", type: "text" },
  { key: "legalName", label: "Legal name", placeholder: "Exactly as shown on GST certificate", type: "text" },
  { key: "tradeName", label: "Trade name", placeholder: "Exactly as shown on GST certificate", type: "text" },
  { key: "registeredAddress", label: "Registered address", placeholder: "Exactly as shown on GST certificate", type: "text" },
];

const emptyContent = {
  whatsappNumber: "",
  businessEmail: "",
  gstNumber: "",
  legalName: "",
  tradeName: "",
  registeredAddress: "",
  privacyPolicy: "",
  termsAndConditions: "",
  aboutUs: "",
  returnPolicy: "",
  checkoutNote: "",
  razorpayEnabled: true,
  cartNotes: [],
};

const MAX_CART_NOTES = 20;
const NOTE_PLACEHOLDER = "e.g. Courier charge will be added (depends on weight and COD amount).";

const CHECKOUT_NOTE_MAX = 5000;

// Normalise API content so the toggle is always a real boolean and the note a string
const normaliseContent = (raw = {}) => ({
  ...emptyContent,
  ...raw,
  checkoutNote: raw.checkoutNote || "",
  razorpayEnabled: raw.razorpayEnabled !== false,
  cartNotes: Array.isArray(raw.cartNotes)
    ? raw.cartNotes.map((n) => ({
        text: String(n?.text ?? ""),
        showWhen: NOTE_CONDITIONS.some((c) => c.value === n?.showWhen) ? n.showWhen : "always",
      }))
    : [],
});

const AppContent = () => {
  const [content, setContent] = useState(emptyContent);
  const [savedContent, setSavedContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await api.get("/app-content/get-content");
      const nextContent = normaliseContent(response.data.content);
      setContent(nextContent);
      setSavedContent(nextContent);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load app content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setContent((current) => ({ ...current, [name]: value }));
  };

  const addNote = () =>
    setContent((current) =>
      current.cartNotes.length >= MAX_CART_NOTES
        ? current
        : { ...current, cartNotes: [...current.cartNotes, { text: "", showWhen: "always" }] }
    );
  const updateNote = (index, patch) =>
    setContent((current) => ({
      ...current,
      cartNotes: current.cartNotes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    }));
  const removeNote = (index) =>
    setContent((current) => ({ ...current, cartNotes: current.cartNotes.filter((_, i) => i !== index) }));
  const moveNote = (index, direction) =>
    setContent((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.cartNotes.length) return current;
      const next = [...current.cartNotes];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, cartNotes: next };
    });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (savedContent.razorpayEnabled && !content.razorpayEnabled) {
      const confirmed = window.confirm(
        "Turn off Razorpay? Customers will only see a Place Order button and you will collect payment manually (GPay or COD)."
      );
      if (!confirmed) return;
    }

    setSaving(true);

    try {
      // Blank rows are dropped by the server; the old single-line fields are
      // derived there from this list, so they are not sent from here.
      const {
        minimumOrderNotice, courierChargeNotice, advancePaymentNotice, // eslint-disable-line no-unused-vars
        ...payload
      } = content;
      const response = await api.put("/app-content/update-content", payload);
      const nextContent = normaliseContent(response.data.content);
      setContent(nextContent);
      setSavedContent(nextContent);
      toast.success("App content updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update app content");
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => setContent(savedContent);

  return (
    <Layout title="App Content | Smitox">
      <AdminMenu />
      <section className="app-content-page">
        <div className="app-content-heading">
          <div>
            <p className="app-content-eyebrow">Settings</p>
            <h1>App content</h1>
            <p>Manage the business identity and legal content shown across the storefront.</p>
          </div>
          <div className="app-content-status" aria-live="polite">
            {loading ? "Loading content..." : "Changes apply to the public footer"}
          </div>
        </div>

        <form className="app-content-form" onSubmit={handleSubmit}>
          <div className="app-content-section">
            <div className="app-content-section-heading">
              <h2>Checkout settings</h2>
              <span>Shown on the website and app cart, above the Place Order button</span>
            </div>

            <div className="app-content-toggle-row">
              <label className="app-content-toggle">
                <input
                  type="checkbox"
                  role="switch"
                  name="razorpayEnabled"
                  checked={content.razorpayEnabled}
                  onChange={(e) => setContent((current) => ({ ...current, razorpayEnabled: e.target.checked }))}
                  disabled={loading || saving}
                  aria-describedby="razorpay-toggle-help"
                />
                <span className="app-content-toggle-track" aria-hidden="true" />
                <span className="app-content-toggle-text">
                  <strong>Razorpay online payment</strong>
                  <small id="razorpay-toggle-help">
                    {content.razorpayEnabled
                      ? "Customers choose Razorpay / COD / Advance as per their account."
                      : "Customers only see a Place Order button. Orders show payment as \"Order Placed\" and you collect payment manually (GPay or COD)."}
                  </small>
                </span>
              </label>
              <span className={`app-content-pill ${content.razorpayEnabled ? "is-on" : "is-off"}`}>
                {content.razorpayEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <label className="app-content-field">
              <span>Checkout note</span>
              <textarea
                name="checkoutNote"
                value={content.checkoutNote}
                onChange={handleChange}
                placeholder="e.g. Courier charges are extra. Orders are dispatched within 48 hours."
                rows="6"
                maxLength={CHECKOUT_NOTE_MAX}
                disabled={loading || saving}
              />
              <small className="app-content-hint">
                {content.checkoutNote.length}/{CHECKOUT_NOTE_MAX} · Long notes are shortened at checkout with a
                “Show more” link. Leave empty to hide the note.
              </small>
            </label>
          </div>

          <div className="app-content-section">
            <div className="app-content-section-heading">
              <h2>Cart page notes</h2>
              <span>The red lines under the cart total (website, app, and the customer's Orders view)</span>
            </div>

            <div className="app-content-field">
              <span>Notes</span>
              {content.cartNotes.length === 0 && (
                <small className="app-content-hint">No notes. Nothing is shown under the cart total. Add one below.</small>
              )}
              {content.cartNotes.map((note, index) => (
                <div className="app-content-note-row" key={index}>
                  <input
                    type="text"
                    value={note.text}
                    placeholder={NOTE_PLACEHOLDER}
                    maxLength={500}
                    onChange={(e) => updateNote(index, { text: e.target.value })}
                    disabled={loading || saving}
                    aria-label={`Note ${index + 1} text`}
                  />
                  <select
                    value={note.showWhen}
                    onChange={(e) => updateNote(index, { showWhen: e.target.value })}
                    disabled={loading || saving}
                    aria-label={`Note ${index + 1} show when`}
                  >
                    {NOTE_CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <div className="app-content-note-actions">
                    <button type="button" onClick={() => moveNote(index, -1)} disabled={index === 0 || loading || saving} aria-label="Move up">↑</button>
                    <button type="button" onClick={() => moveNote(index, 1)} disabled={index === content.cartNotes.length - 1 || loading || saving} aria-label="Move down">↓</button>
                    <button type="button" className="is-danger" onClick={() => removeNote(index)} disabled={loading || saving} aria-label="Remove note">✕</button>
                  </div>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="app-content-reset"
                  onClick={addNote}
                  disabled={loading || saving || content.cartNotes.length >= MAX_CART_NOTES}
                >
                  + Add note
                </button>
              </div>
              <small className="app-content-hint">
                Use {"{amount}"} for the minimum order amount and {"{percent}"} for the advance %. Blank notes are ignored.
                Up to {MAX_CART_NOTES} notes.
              </small>
            </div>

            <div className="app-content-field">
              <span>Preview (sample: minimum ₹8,000, advance 10%, cart below the minimum)</span>
              <ul style={{ color: "#c62828", margin: 0, paddingLeft: "1.2rem" }}>
                {content.cartNotes
                  .map((n) => (n.text || "").replaceAll("{amount}", "₹8,000.00").replaceAll("{percent}", "10").trim())
                  .filter(Boolean)
                  .map((text, i) => <li key={i}>{text}</li>)}
              </ul>
              <small className="app-content-hint">Remember to press Save at the bottom to publish changes.</small>
            </div>
          </div>

          <div className="app-content-section">
            <div className="app-content-section-heading">
              <h2>Business information</h2>
              <span>Shown in the footer and contact areas</span>
            </div>
            <div className="app-content-grid">
              {fields.map((field) => (
                <label className="app-content-field" key={field.key}>
                  <span>{field.label}</span>
                  <input
                    name={field.key}
                    type={field.type}
                    value={content[field.key]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.key !== "gstNumber"}
                    disabled={loading || saving}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="app-content-section">
            <div className="app-content-section-heading">
              <h2>Legal pages</h2>
              <span>Each text area is displayed on its linked public page</span>
            </div>
            <label className="app-content-field">
              <span>Privacy Policy</span>
              <textarea
                name="privacyPolicy"
                value={content.privacyPolicy}
                onChange={handleChange}
                placeholder="Enter the privacy policy shown at /policy"
                rows="12"
                disabled={loading || saving}
              />
            </label>
            <label className="app-content-field">
              <span>Terms &amp; Conditions</span>
              <textarea
                name="termsAndConditions"
                value={content.termsAndConditions}
                onChange={handleChange}
                placeholder="Enter the terms shown at /terms"
                rows="12"
                disabled={loading || saving}
              />
            </label>
            <label className="app-content-field">
              <span>About Us</span>
              <textarea
                name="aboutUs"
                value={content.aboutUs}
                onChange={handleChange}
                placeholder="Enter the content shown at /about"
                rows="8"
                disabled={loading || saving}
              />
            </label>
            <label className="app-content-field">
              <span>Return Policy</span>
              <textarea
                name="returnPolicy"
                value={content.returnPolicy}
                onChange={handleChange}
                placeholder="Enter the content shown at /returnPolicy"
                rows="8"
                disabled={loading || saving}
              />
            </label>
          </div>

          <div className="app-content-actions">
            <button type="button" className="app-content-reset" onClick={resetChanges} disabled={loading || saving}>
              Reset changes
            </button>
            <button type="submit" className="app-content-save" disabled={loading || saving}>
              {saving ? "Saving..." : "Save app content"}
            </button>
          </div>
        </form>
      </section>
    </Layout>
  );
};

export default AppContent;
