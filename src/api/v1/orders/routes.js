const { checkAuthStatus, isNotRestrict } = require("../users/controller");
const {
  getOrdersByUser,
  createOrder,
  getOrders,
  getOrderLinks,
  getLinksByDripfeed,
} = require("./controller");

const router = require("express").Router();

router.get("/all", checkAuthStatus, isNotRestrict, getOrders);

router.get("/dripfeed/:dripfeed", checkAuthStatus, getLinksByDripfeed);

router.get("/:orderId", checkAuthStatus, getOrderLinks);

router
  .route("/")
  .get(checkAuthStatus, getOrdersByUser)
  .post(checkAuthStatus, isNotRestrict, createOrder);

module.exports = router;
