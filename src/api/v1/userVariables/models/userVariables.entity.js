const mongoose = require("mongoose");

const userVariableSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    isRestrict: {
      type: Boolean,
      default: false,
    },
    totalLinks: {
      type: Number,
      default: 0,
    },
    forgotPasswordToken: {
      type: String,
    },
    otpSecret: {
      type: String,
    },
    // monthlyLimit: {
    //   type: Number,
    //   default: 5000,
    // },
    // monthlyUsed: {
    //   type: Number,
    //   default: 0,
    // },
    totalLimit: {
      type: Number,
      default: 0,
    },
    lastResetLinksDate: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("userVariables", userVariableSchema);
