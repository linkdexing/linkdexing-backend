const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 4,
    },
    email: {
      type: String,
      required: true,
      validate:
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    password: {
      type: String,
      required: true,
      validate: /^.{5,}$/,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
