const { checkAuthStatus } = require("../users/controller");
const { getOrdersByUser, createOrder } = require("./controller");

const router = require("express").Router();

router
  .route("/")
  .get(checkAuthStatus, getOrdersByUser)
  .post(checkAuthStatus, createOrder);

module.exports = router;
