import mongoose from "mongoose";

const subscriptionHistorySchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        sellerProfileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SellerProfile",
            required: true
        },
        previousPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            default: null
        },
        newPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true
        },
        actionType: {
            type: String,
            enum: [
                'initial_activation',
                'manual_renewal',
                'auto_renew',
                'auto_downgrade',
                'upgrade',
                'downgrade',
                'suspension',
                'reactivation'
            ],
            required: true
        },
        triggeredBy: {
            type: String,
            enum: ['user', 'system', 'admin'],
            required: true
        },
        paymentId: {
            type: String,
            default: null
        },
        paymentAmount: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['success', 'failed', 'pending', 'not_required'],
            default: 'not_required'
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

// Indexes for analytics and queries
subscriptionHistorySchema.index({ sellerId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ sellerProfileId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ actionType: 1, createdAt: -1 });
subscriptionHistorySchema.index({ triggeredBy: 1, createdAt: -1 });

export default mongoose.model("SubscriptionHistory", subscriptionHistorySchema);
