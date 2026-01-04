import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // Actor Information
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      enum: ["user", "admin", "seller", "super_admin", "unknown"],
      default: "unknown",
    },
    // Action Details
    action: {
      type: String,
      required: true,
      // Examples: "create", "update", "delete", "approve", "reject", "suspend", "refund"
    },
    resourceType: {
      type: String,
      required: true,
      // Examples: "product", "order", "user", "seller_application", "subscription_plan"
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Changes
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    // Request Information
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Severity
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    // Additional Context
    description: {
      type: String,
      default: null,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Index for efficient querying
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
