const { checkAuthStatus } = require("../users/controller");
const {
  getOrdersByUser,
  createOrder,
  getOrders,
  getOrderLinks,
  getLinksByDripfeed,
} = require("./controller");

const router = require("express").Router();

router.get("/all", checkAuthStatus, getOrders);

router.get("/dripfeed/:dripfeed", checkAuthStatus, getLinksByDripfeed);

router.get("/:orderId", checkAuthStatus, getOrderLinks);

router
  .route("/")
  .get(checkAuthStatus, getOrdersByUser)
  .post(checkAuthStatus, createOrder);

module.exports = router;
