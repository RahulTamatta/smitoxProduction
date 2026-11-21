import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SellerMenu from "../../../components/Layout/SellerMenu";
import Layout from "../../../components/Layout/Layout";

const SellerStore = () => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    businessDescription: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Fetch vendor info
  const getVendorInfo = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/v1/seller-portal/me');
      if (data.success) {
        setVendor(data.vendor);
        setFormData({
          storeName: data.vendor.storeName || '',
          businessDescription: data.vendor.businessDescription || '',
          primaryContactName: data.vendor.primaryContactName || '',
          primaryContactEmail: data.vendor.primaryContactEmail || '',
          primaryContactPhone: data.vendor.primaryContactPhone || ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load store information');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    getVendorInfo();
  }, []);

  // Form change handler
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.storeName.trim()) {
      toast.error('Store name is required');
      return false;
    }
    if (formData.storeName.length > 80) {
      toast.error('Store name must be 80 characters or less');
      return false;
    }
    if (formData.businessDescription.length > 1000) {
      toast.error('Business description must be 1000 characters or less');
      return false;
    }
    if (!formData.primaryContactPhone.trim()) {
      toast.error('Primary contact phone is required');
      return false;
    }
    return true;
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const { data } = await axios.put('/api/v1/seller-portal/me', formData);
      
      if (data.success) {
        toast.success('Store details saved successfully');
        setIsEditing(false);
        // Refresh vendor info
        getVendorInfo();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save store details');
    } finally {
      setLoading(false);
    }
  };

  // Copy the public store link to the clipboard
  const copyStoreLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/seller/${vendor.storeSlug}`);
      toast.success('Store link copied');
    } catch (error) {
      toast.error('Could not copy the store link');
    }
  };

  // Password change handler
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      setPasswordSaving(true);
      const { data } = await axios.put('/api/v1/seller-portal/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(data.message || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!vendor?.planExpiresAt) return null;
    const expiryDate = new Date(vendor.planExpiresAt);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Layout title="Store Profile">
      <SellerMenu />
      <div className="container-fluid dashboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '4px', color: '#0f172a' }}>
              Store Profile
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
              Manage your store details and plan information.
            </p>
          </div>

          {/* Public store link */}
          {vendor?.storeSlug && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>Your public store</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <a
                  href={`/seller/${vendor.storeSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '14px', color: '#3b82f6', wordBreak: 'break-all' }}
                >
                  {`${window.location.origin}/seller/${vendor.storeSlug}`}
                </a>
                <button
                  onClick={copyStoreLink}
                  style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Copy link
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0' }}>
                Your store URL is fixed; contact Smitox support to change it.
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && !vendor && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
          )}

          {/* Plan and Status Card */}
          {vendor && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>Plan & Status</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Current Plan</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{vendor.currentPlanId?.name || 'Basic'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Price per {vendor.currentPlanId?.billingCycle || 'month'}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>₹{vendor.currentPlanId?.price || '0'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: vendor.status ? '#16a34a' : '#dc2626'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: vendor.status ? '#16a34a' : '#dc2626' }}>
                      {vendor.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Verified</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: vendor.isVerified ? '#16a34a' : '#94a3b8'
                    }}></div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: vendor.isVerified ? '#16a34a' : '#94a3b8' }}>
                      {vendor.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
                {vendor.planExpiresAt && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Expires</div>
                    <div style={{ fontSize: '14px', color: '#0f172a' }}>
                      {new Date(vendor.planExpiresAt).toLocaleDateString()}
                      {getDaysUntilExpiry() !== null && (
                        <span style={{ color: getDaysUntilExpiry() <= 7 ? '#dc2626' : '#6b7280', fontSize: '12px', marginLeft: '4px' }}>
                          ({getDaysUntilExpiry() > 0 ? `in ${getDaysUntilExpiry()} days` : 'Expired'})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => window.location.href = '/seller/dashboard'}
                  style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  🔄 Renew / upgrade plan
                </button>
              </div>
            </div>
          )}

          {/* Store Details Form */}
          {vendor && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>Store Details</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Store Name *</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={handleInputChange('storeName')}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      backgroundColor: isEditing ? 'white' : '#f8fafc',
                      cursor: isEditing ? 'text' : 'not-allowed'
                    }}
                    maxLength={80}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{formData.storeName.length}/80 characters</div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Business Description</label>
                  <textarea
                    value={formData.businessDescription}
                    onChange={handleInputChange('businessDescription')}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      minHeight: '100px',
                      resize: 'vertical',
                      backgroundColor: isEditing ? 'white' : '#f8fafc',
                      cursor: isEditing ? 'text' : 'not-allowed'
                    }}
                    maxLength={1000}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{formData.businessDescription.length}/1000 characters</div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Primary Contact Name</label>
                  <input
                    type="text"
                    value={formData.primaryContactName}
                    onChange={handleInputChange('primaryContactName')}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      backgroundColor: isEditing ? 'white' : '#f8fafc',
                      cursor: isEditing ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Primary Contact Email</label>
                  <input
                    type="email"
                    value={formData.primaryContactEmail}
                    onChange={handleInputChange('primaryContactEmail')}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      backgroundColor: isEditing ? 'white' : '#f8fafc',
                      cursor: isEditing ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Primary Contact Phone *</label>
                  <input
                    type="tel"
                    value={formData.primaryContactPhone}
                    onChange={handleInputChange('primaryContactPhone')}
                    disabled={!isEditing}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      fontSize: '14px',
                      backgroundColor: isEditing ? 'white' : '#f8fafc',
                      cursor: isEditing ? 'text' : 'not-allowed'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      style={{ backgroundColor: '#16a34a', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                      style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    ✏️ Edit Store Details
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Change password */}
          {vendor && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e4e7eb', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>Change password</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Current password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>New password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    minLength={8}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>At least 8 characters</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Confirm password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    minLength={8}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving}
                  style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: passwordSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', opacity: passwordSaving ? 0.7 : 1 }}
                >
                  {passwordSaving ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SellerStore;