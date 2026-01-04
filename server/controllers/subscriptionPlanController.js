import subscriptionPlanModel from "../models/subscriptionPlanModel.js";
import { logAuditEvent } from "../middlewares/rbacMiddleware.js";
import { ROLES } from "../config/rbac-policy.js";

/**
 * Create subscription plan (Super Admin only)
 * Enforces single active Free plan
 */
export const createSubscriptionPlan = async (req, res) => {
  try {
    const planData = req.body;

    // Validate required fields
    if (!planData.name || !planData.description || !planData.billingCycle) {
      return res.status(400).send({
        success: false,
        message: "Name, description, and billing cycle are required",
      });
    }

    // Check if plan name already exists
    const existingPlan = await subscriptionPlanModel.findOne({
      name: planData.name,
    });
    if (existingPlan) {
      return res.status(400).send({
        success: false,
        message: "Plan with this name already exists",
      });
    }

    // Enforce single active Free plan
    if (planData.isFree === true) {
      // Deactivate all other free plans
      await subscriptionPlanModel.updateMany(
        { isFree: true, _id: { $ne: null } },
        { $set: { isFree: false } }
      );
    }

    const plan = new subscriptionPlanModel(planData);
    await plan.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "create",
      resourceType: "subscription_plan",
      resourceId: plan._id,
      severity: "medium",
      description: `Subscription plan created: ${plan.name}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).send({
      success: true,
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).send({
      success: false,
      message: "Error creating plan",
      error: error.message,
    });
  }
};

/**
 * Get all subscription plans
 */
export const getSubscriptionPlans = async (req, res) => {
  try {
    const { isActive, isFree, page = 1, limit = 10 } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isFree !== undefined) query.isFree = isFree === "true";

    const skip = (page - 1) * limit;

    const plans = await subscriptionPlanModel
      .find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await subscriptionPlanModel.countDocuments(query);

    res.status(200).send({
      success: true,
      plans,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching plans",
      error: error.message,
    });
  }
};

/**
 * Get single subscription plan
 */
export const getSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await subscriptionPlanModel.findById(id);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).send({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error fetching subscription plan:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching plan",
      error: error.message,
    });
  }
};

/**
 * Update subscription plan (Super Admin only)
 */
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await subscriptionPlanModel.findById(id);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    // Store original data for audit
    const originalData = plan.toObject();

    // Update plan
    Object.assign(plan, updateData);
    await plan.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "update",
      resourceType: "subscription_plan",
      resourceId: plan._id,
      severity: "medium",
      description: `Subscription plan updated: ${plan.name}`,
      changes: {
        before: originalData,
        after: plan.toObject(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Subscription plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error updating subscription plan:", error);
    res.status(500).send({
      success: false,
      message: "Error updating plan",
      error: error.message,
    });
  }
};

/**
 * Toggle plan active/free status (Super Admin only)
 * Enforces single active Free plan
 */
export const togglePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isFree } = req.body;

    const plan = await subscriptionPlanModel.findById(id);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    const originalData = plan.toObject();

    // Enforce single active Free plan
    if (isFree === true) {
      // Deactivate all other free plans
      await subscriptionPlanModel.updateMany(
        { _id: { $ne: id }, isFree: true },
        { $set: { isFree: false } }
      );
    }

    if (isActive !== undefined) plan.isActive = isActive;
    if (isFree !== undefined) plan.isFree = isFree;

    await plan.save();

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "toggle_status",
      resourceType: "subscription_plan",
      resourceId: plan._id,
      severity: "high",
      description: `Plan status toggled: ${plan.name} (active: ${plan.isActive}, free: ${plan.isFree})`,
      changes: {
        before: originalData,
        after: plan.toObject(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Plan status updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Error toggling plan status:", error);
    res.status(500).send({
      success: false,
      message: "Error toggling plan status",
      error: error.message,
    });
  }
};

/**
 * Delete subscription plan (Super Admin only)
 */
export const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await subscriptionPlanModel.findById(id);
    if (!plan) {
      return res.status(404).send({
        success: false,
        message: "Plan not found",
      });
    }

    const planName = plan.name;
    await subscriptionPlanModel.findByIdAndDelete(id);

    // Log audit event
    await logAuditEvent({
      actor: req.user._id,
      actorRole: ROLES.SUPER_ADMIN,
      action: "delete",
      resourceType: "subscription_plan",
      resourceId: id,
      severity: "high",
      description: `Subscription plan deleted: ${planName}`,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).send({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subscription plan:", error);
    res.status(500).send({
      success: false,
      message: "Error deleting plan",
      error: error.message,
    });
  }
};

/**
 * Get active plans for seller wizard
 */
export const getActivePlans = async (req, res) => {
  try {
    const plans = await subscriptionPlanModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, isFree: -1, price: 1 });

    res.status(200).send({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching active plans:", error);
    res.status(500).send({
      success: false,
      message: "Error fetching plans",
      error: error.message,
    });
  }
};

export default {
  createSubscriptionPlan,
  getSubscriptionPlans,
  getSubscriptionPlan,
  updateSubscriptionPlan,
  togglePlanStatus,
  deleteSubscriptionPlan,
  getActivePlans,
};
