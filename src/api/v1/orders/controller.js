const User = require("../users/models/user.entity");
const UserVariables = require("../userVariables/models/userVariables.entity");
const Order = require("./models/order.entity");

// Create order
exports.createOrder = async (req, res, next) => {
  try {
    const { links, dripfeed } = req.body;
    const { id } = req.user;

    // Total Number of links
    const linksCount = links.split("\n").length;

    const userVariables = await UserVariables.findOne({ user: id });

    const currentCount = userVariables.monthlyUsed + linksCount;

    if (currentCount > userVariables.monthlyLimit) {
      res.status(403);
      throw new Error("Your monthly limit of links has been exceeded");
    }

    const order = new Order({
      userId: id,
      links,
      dripfeed,
    });

    await order.save();

    userVariables.totalLinks += linksCount;
    userVariables.monthlyUsed = currentCount;

    await userVariables.save();

    return res.status(201).json({
      ok: true,
      order,
    });
  } catch (err) {
    return next(err);
  }
};

// Process order in Admin (order completed)
exports.processOrder = async (req, res, next) => {
  try {
    const { orderIds } = req.body;

    for (const orderId of orderIds) {
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
  } catch (err) {
    return next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user");

    return res.json({
      ok: true,
      orders,
    });
  } catch (err) {
    return next(err);
  }
};

exports.getOrdersByUser = async (req, res, next) => {
  try {
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
  } catch (err) {
    return next(err);
  }
};

exports.getOrderLinks = async (req, res, next) => {
  try {
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
  } catch (err) {
    return next(err);
  }
};

exports.getOrdersByDripfeed = async (req, res, next) => {
  try {
    const { dripfeed } = req.params;

    let orders = await Order.find({
      dripfeed,
    }).select(["links", "isProcessed"]);

    orders = orders.filter((order) => !order.isProcessed);

    return res.json({
      ok: true,
      orders,
    });
  } catch (err) {
    return next(err);
  }
};
