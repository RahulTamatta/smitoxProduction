import axios from "axios";

const API_BASE = "/api/v1";

/**
 * Seller Application API Methods
 */

/**
 * Save draft application
 */
export const saveDraftApplication = async (applicationData, token) => {
  try {
    // Try to read selectedPlanId so we can also send it as a query param
    let selectedPlanId;
    if (applicationData instanceof FormData) {
      selectedPlanId = applicationData.get("selectedPlanId");
    } else if (applicationData && applicationData.selectedPlanId) {
      selectedPlanId = applicationData.selectedPlanId;
    }

    const response = await axios.post(
      `${API_BASE}/sellers/apply`,
      applicationData,
      {
        // Send as query param as a fallback in case body parsing fails on the server
        params: selectedPlanId ? { selectedPlanId } : undefined,
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Submit application (finalize and lock plan)
 */
export const submitApplication = async (applicationId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/sellers/submit`,
      { applicationId },
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get user's application status
 */
export const getMyApplication = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE}/sellers/my-application`,
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all subscription plans (public)
 */
export const getActiveSubscriptionPlans = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/subscription-plans/active`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Retry payment for failed application
 */
export const retryPayment = async (applicationId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/sellers/${applicationId}/retry-payment`,
      {},
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get checkout data for approved_pending_payment application
 */
export const getCheckoutData = async (applicationId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE}/payments/checkout-data/${applicationId}`,
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Admin: Get all seller applications
 */
export const getSellerApplications = async (
  { status, page = 1, limit = 10, search, sort = "-createdAt" },
  token
) => {
  try {
    const response = await axios.get(
      `${API_BASE}/sellers`,
      {
        params: { status, page, limit, search, sort },
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Admin: Get single application
 */
export const getApplicationById = async (applicationId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE}/sellers/${applicationId}`,
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Admin: Approve application
 */
export const approveApplication = async (applicationId, reviewerNotes, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/sellers/${applicationId}/approve`,
      { reviewerNotes },
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Admin: Reject application
 */
export const rejectApplication = async (applicationId, reason, token) => {
  try {
    const response = await axios.post(
      `${API_BASE}/sellers/${applicationId}/reject`,
      { reason },
      {
        headers: { Authorization: token },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  saveDraftApplication,
  submitApplication,
  getMyApplication,
  getActiveSubscriptionPlans,
  retryPayment,
  getCheckoutData,
  getSellerApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
};
