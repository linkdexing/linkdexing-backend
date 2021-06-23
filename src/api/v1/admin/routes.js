const router = require("express").Router();
const {
  login,
  isAuthenticated,
  checkAuthStatus,
  isAdmin,
  changeUserLinksLimit,
} = require("./controller");

router.post("/", login);
router.get("/me", checkAuthStatus, isAuthenticated);
router.post(
  "/change-limit/:userId",
  checkAuthStatus,
  isAdmin,
  changeUserLinksLimit
);

module.exports = router;
