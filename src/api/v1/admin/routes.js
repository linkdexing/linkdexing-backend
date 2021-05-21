const router = require("express").Router();
const { login, isAuthenticated, checkAuthStatus } = require("./controller");

router.post("/", login);
router.get("/me", checkAuthStatus, isAuthenticated);

module.exports = router;
