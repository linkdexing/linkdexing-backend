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
} = require("./controller");

router.get("/search", checkAuthStatus, getUsers);

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

router.post("/change-password", checkAuthStatus, isNotRestrict, changePassword);

router.delete("/delete/:q", checkAuthStatus, deleteUser);

router.post("/restrict/:id", checkAuthStatus, restrictUser);

module.exports = router;
