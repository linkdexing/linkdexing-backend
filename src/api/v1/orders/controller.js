const User = require("../users/models/user.entity");
const Order = require("./models/order.entity");

// Create order
exports.createOrder = async (req, res) => {
  const { links, dripfeed } = req.body;
  const { id } = req.user;

  const order = new Order({
    userId: id,
    links,
    dripfeed,
  });

  await order.save();

  // Total Number of links
  const linksCount = links.split("\n").length;

  const user = await User.findById(id);
  user.totalLinks += linksCount;

  await user.save();

  return res.status(201).json({
    ok: true,
    order,
  });
};

// Process order in Admin (order completed)
exports.processOrder = async (req, res) => {
  const { orderIds } = req.body;

  for (orderId of orderIds) {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: "Order not found",
      });
    }

    order.isProcessed = true;
    await order.save();
  }

  return res.json({
    ok: true,
  });
};

exports.getOrders = async (req, res) => {
  const orders = await Order.find().populate("user");

  return res.json({
    ok: true,
    orders,
  });
};

exports.getOrdersByUser = async (req, res) => {
  const { id } = req.user;
  const orders = await Order.find({
    userId: id,
  }).sort({
    createdAt: -1,
  });

  return res.json({
    ok: true,
    orders,
  });
};

exports.getOrderLinks = async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      ok: false,
      message: "Invalid order id",
    });
  }

  let { links } = order;

  links = links.split("\n");

  return res.json({
    ok: true,
    links,
  });
};

exports.getOrdersByDripfeed = async (req, res, next) => {
  const { dripfeed } = req.params;

  let orders = await Order.find({
    dripfeed,
  }).select(["links", "isProcessed"]);

  orders = orders.filter((order) => !order.isProcessed);

  return res.json({
    ok: true,
    orders,
  });
};
