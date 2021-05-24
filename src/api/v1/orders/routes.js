const { checkAuthStatus } = require("../users/controller");
const { getOrdersByUser, createOrder, getOrders } = require("./controller");

const router = require("express").Router();

router.get("/all", checkAuthStatus, getOrders);

router
  .route("/")
  .get(checkAuthStatus, getOrdersByUser)
  .post(checkAuthStatus, createOrder);

module.exports = router;
