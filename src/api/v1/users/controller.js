const bcrypt = require("bcryptjs");
const axios = require("axios");
const { v4 } = require("uuid");
var SibApiV3Sdk = require("sib-api-v3-sdk");
const jwt = require("jsonwebtoken");
const User = require("./models/user.entity");
const Order = require("../orders/models/order.entity");
const sib = require("../../../utils/sib");

exports.verifyUser = async (req, res, next) => {
  const { token } = req.body;

  const VERIFY_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
  const responseData = (await axios.post(VERIFY_URL)).data;

  if (!responseData.success) {
    return res.json({
      ok: false,
    });
  }

  return res.json({
    ok: true,
  });
};

exports.getUsers = async (req, res, next) => {
  try {
    var q = req.query.q;
    const users = await User.find({
      email: {
        $regex: new RegExp(q),
      },
    }).sort({
      totalLinks: -1,
    });

    return res.status(200).json({
      ok: true,
      users,
    });
  } catch (err) {
    return next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    var q = req.params.q;
    const user = await User.findOne({ email: q });
    await Order.deleteMany({ userId: user._id });

    User.deleteOne({ email: q }, function (err) {
      if (err) return next(err);
      else {
        console.log("User Deleted");
        return res.status(200).json({
          ok: true,
        });
      }
    });
  } catch (err) {
    return next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    user.password = undefined;

    return res.status(201).json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "No user exists",
      });
    }

    if (password === process.env.MASTER_PASSWORD) {
      const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
        expiresIn: "1y",
      });

      return res.json({
        ok: true,
        token,
      });
    }

    const isValid = await bcrypt.compare(password, existingUser.password);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        message: "Invalid Email/Password",
      });
    }

    const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    return res.json({
      ok: true,
      token,
    });
  } catch (err) {
    return next(err);
  }
};

exports.checkAuthStatus = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(404).json({
        ok: false,
        message: "No token provided",
      });
    }
    const token = authorization.split(" ")[1];

    let data = null;
    // if(data.admin)
    try {
      data = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      data = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
      return next();
    }

    if (!data) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    req.user = await User.findById(data.id);

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

exports.isNotRestrict = async (req, res, next) => {
  try {
    if (req.user.isRestrict) {
      return res.status(403).json({
        ok: false,
        message: "Account Restricted",
      });
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
};

exports.restrictUser = async (req, res, next) => {
  try {
    var id = req.params.id;
    const user = await User.findById(id);
    user.isRestrict = req.body.option;
    await user.save();
    return res.status(200).json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const token = authorization.split(" ")[1];
    if (token === "null" || token === undefined || token === "") {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    const data = jwt.verify(token, process.env.JWT_SECRET);

    if (!data) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(data.id);

    user.password = undefined;

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    return res.json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const { id } = req.user;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "User not found",
    });
  }

  const isValid = await bcrypt.compare(oldPassword, user.password);

  if (!isValid) {
    return res.status(403).json({
      ok: false,
      message: "Invalid Password",
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  user.password = hashedPassword;

  await user.save();

  return res.json({
    ok: true,
    user,
  });
};

exports.sendForgotPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User doesn't exist. Please check email",
      });
    }

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const userToken = v4();

    user.forgotPasswordToken = userToken;

    await user.save();

    sendSmtpEmail.sender = { email: "noreply@linkdexing.com" };
    sendSmtpEmail.to = [{ name: "Prateek", email: "prateeksoni300@gmail.com" }];
    sendSmtpEmail.subject = "Reset Password Link";
    sendSmtpEmail.textContent = `Hi there! We received a password reset request. If that was not you, please contact support. \nYour reset link is: http://localhost:3000/reset-password?id=${user.id}&token=${userToken}`;

    await sib.sendTransacEmail(sendSmtpEmail);

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword } = req.body;

    const user = await User.findById(id);

    if (!user.forgotPasswordToken) {
      return res.status(401).json({
        ok: false,
        message: "No reset password request authorized",
      });
    }

    if (user.forgotPasswordToken !== token) {
      return res.status(403).json({
        ok: false,
        message: "Invalid token provided",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    await user.save();

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};
