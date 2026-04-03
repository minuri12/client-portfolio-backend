import mongoose from "mongoose";

const blackListTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic deletion of expired tokens
blackListTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlackListToken = mongoose.model("BlackListToken", blackListTokenSchema);

export default BlackListToken;
