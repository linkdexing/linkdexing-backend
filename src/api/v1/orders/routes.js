const { checkAuthStatus, isNotRestrict } = require("../users/controller");
const {
  getOrdersByUser,
  createOrder,
  getOrders,
  getOrderLinks,
  getOrdersByDripfeed,
  processOrder,
} = require("./controller");

const router = require("express").Router();

router.get("/all", checkAuthStatus, isNotRestrict, getOrders);

router.get("/dripfeed/:dripfeed", checkAuthStatus, getOrdersByDripfeed);

router.post("/process", checkAuthStatus, processOrder);

router.get("/:orderId", checkAuthStatus, getOrderLinks);

router
  .route("/")
  .get(checkAuthStatus, getOrdersByUser)
  .post(checkAuthStatus, isNotRestrict, createOrder);

module.exports = router;
