const router = require("express").Router();
const { login, isSuperAdmin } = require("./controller");

router.post("/", login);

router.get("/isSuperAdmin", isSuperAdmin);

module.exports = router;
