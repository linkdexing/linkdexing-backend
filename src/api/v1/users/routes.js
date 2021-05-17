const router = require("express").Router();
const { register, login, isAuthenticated } = require("./controller");

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

module.exports = router;
