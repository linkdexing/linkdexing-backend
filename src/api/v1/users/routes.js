const router = require("express").Router();
const { register, login, isAuthenticated, getUsers } = require("./controller");

router.route("/").post(register);

router.post("/login", login);

router.get("/isAuthenticated", isAuthenticated);

router.get("/search", getUsers);

module.exports = router;
