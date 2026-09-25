import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "../../components/Layout/Layout";
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
};

const AppContent = () => {
  const [content, setContent] = useState(emptyContent);
  const [savedContent, setSavedContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await api.get("/app-content/get-content");
      const nextContent = { ...emptyContent, ...response.data.content };
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await api.put("/app-content/update-content", content);
      const nextContent = { ...emptyContent, ...response.data.content };
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
