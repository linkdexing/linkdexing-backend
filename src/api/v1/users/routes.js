const router = require("express").Router();
const {
  register,
  login,
  isAuthenticated,
  getUsers,
  checkAuthStatus,
} = require("./controller");

router.get("/search", checkAuthStatus, getUsers);

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

module.exports = router;
