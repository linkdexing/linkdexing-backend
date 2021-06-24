const {
  checkAuthStatus: checkAuthStatusAdmin,
  isAdmin,
} = require("../admin/controller");
const { checkAuthStatus: checkAuthStatusUser } = require("../users/controller");
const {
  shouldResetLinks,
  isNotRestrict,
} = require("../userVariables/controllers");
const {
  getOrdersByUser,
  createOrder,
  getOrders,
  getOrderLinks,
  getOrdersByDripfeed,
  processOrder,
} = require("./controller");

const router = require("express").Router();

router.get(
  "/all",
  checkAuthStatusUser,
  shouldResetLinks,
  isNotRestrict,
  getOrders
);

router.get("/dripfeed/:dripfeed", checkAuthStatusAdmin, getOrdersByDripfeed);

router.post("/process", checkAuthStatusAdmin, isAdmin, processOrder);

router.get("/:orderId", checkAuthStatusUser, shouldResetLinks, getOrderLinks);

router
  .route("/")
  .get(checkAuthStatusUser, getOrdersByUser)
  .post(checkAuthStatusUser, isNotRestrict, createOrder);

module.exports = router;
