const router = require("express").Router();
const {
  register,
  login,
  isAuthenticated,
  getUsers,
  checkAuthStatus,
  changePassword,
  deleteUser,
  isNotRestrict,
  restrictUser,
  verifyUser,
  sendForgotPasswordLink,
  resetPassword,
  sendOtp,
  verifyOtp,
  createContactInSib,
  addContactToSibList,
} = require("./controller");

router.get("/search", checkAuthStatus, getUsers);

router.post("/verify", verifyUser);

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

router.post("/change-password", checkAuthStatus, isNotRestrict, changePassword);

router.delete("/delete/:q", checkAuthStatus, deleteUser);

router.post("/restrict/:id", checkAuthStatus, restrictUser);

router.post("/forgot-password", sendForgotPasswordLink);

router.post("/reset-password", resetPassword);

router.post("/send-otp/:id", sendOtp);

router.post("/verify-otp/:id", verifyOtp);

router.get("/createContactInSib/:id", createContactInSib);

router.get("/addContactToSibList/:id", addContactToSibList);

module.exports = router;
