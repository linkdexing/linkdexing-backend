const router = require("express").Router();
const { isNotRestrict } = require("../userVariables/controllers");
const {
  register,
  login,
  isAuthenticated,
  getUsers,
  checkAuthStatus,
  changePassword,
  deleteUser,
  verifyUser,
  resetPassword,
  createContactInSib,
  addContactToSibList,
} = require("./controller");

router.get("/search", checkAuthStatus, getUsers);
router.post("/verify", verifyUser);
router.route("/").post(register);
router.post("/login", login);
router.get("/isAuthenticated", isAuthenticated);
router.post("/change-password", checkAuthStatus, isNotRestrict, changePassword);
router.delete("/delete/:q", checkAuthStatus, deleteUser);
router.post("/reset-password", resetPassword);
router.get("/createContactInSib/:id", createContactInSib);
router.get("/addContactToSibList/:id", addContactToSibList);

module.exports = router;
