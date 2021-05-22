const router = require("express").Router();
const {
  register,
  login,
  isAuthenticated,
  checkAuthStatus,
  changePassword,
} = require("./controller");

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

router.post("/change-password", checkAuthStatus, changePassword);

module.exports = router;
