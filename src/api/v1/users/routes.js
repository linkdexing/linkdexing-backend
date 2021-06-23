const router = require("express").Router();
const {
  checkAuthStatus: checkAuthStatusAdmin,
  isAdmin,
} = require("../admin/controller");
const {
  isNotRestrict,
  shouldResetLinks,
} = require("../userVariables/controllers");
const {
  register,
  login,
  isAuthenticated,
  getUsers,
  checkAuthStatus: checkAuthStatusUser,
  changePassword,
  deleteUser,
  verifyUser,
  resetPassword,
  createContactInSib,
  addContactToSibList,
} = require("./controller");

router.get("/search", checkAuthStatusUser, shouldResetLinks, getUsers);
router.post("/verify", verifyUser);
router.route("/").post(register);
router.post("/login", login);
router.get("/isAuthenticated", isAuthenticated);
router.post(
  "/change-password",
  checkAuthStatusUser,
  shouldResetLinks,
  isNotRestrict,
  changePassword
);
router.delete("/delete/:q", checkAuthStatusAdmin, isAdmin, deleteUser);
router.post("/reset-password", resetPassword);
router.get("/createContactInSib/:id", createContactInSib);
router.get("/addContactToSibList/:id", addContactToSibList);

module.exports = router;
