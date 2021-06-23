const { checkAuthStatus, isAdmin } = require("../admin/controller");
const {
  restrictUser,
  sendOtp,
  sendForgotPasswordLink,
  verifyOtp,
  shouldResetLinks,
} = require("./controllers");

const router = require("express").Router();

router.post("/restrict/:id", checkAuthStatus, isAdmin, restrictUser);
router.post("/send-otp/:id", sendOtp);
router.post("/forgot-password", sendForgotPasswordLink);
router.post("/verify-otp/:id", verifyOtp);

module.exports = router;
