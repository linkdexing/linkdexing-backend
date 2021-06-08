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

module.exports = router;
