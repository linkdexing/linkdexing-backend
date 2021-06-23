const { checkAuthStatus } = require("../users/controller");
const {
  restrictUser,
  sendOtp,
  sendForgotPasswordLink,
  verifyOtp,
} = require("./controllers");

const router = require("express").Router();

router.post("/restrict/:id", checkAuthStatus, restrictUser);
router.post("/send-otp/:id", sendOtp);
router.post("/forgot-password", sendForgotPasswordLink);
router.post("/verify-otp/:id", verifyOtp);

module.exports = router;
