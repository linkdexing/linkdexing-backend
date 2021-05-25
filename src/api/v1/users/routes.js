const router = require("express").Router();
const {
  register,
  login,
  isAuthenticated,
  getUsers,
  checkAuthStatus,
  changePassword,
} = require("./controller");

router.get("/search", checkAuthStatus, getUsers);
router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

router.post("/change-password", checkAuthStatus, changePassword);

module.exports = router;
