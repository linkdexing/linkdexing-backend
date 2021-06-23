const bcrypt = require("bcryptjs");
const axios = require("axios");
const { totp } = require("otplib");
const { v4 } = require("uuid");
var SibApiV3Sdk = require("sib-api-v3-sdk");
const jwt = require("jsonwebtoken");
const User = require("./models/user.entity");
const Order = require("../orders/models/order.entity");
const { TransactionalEmailsApi, ContactApi } = require("../../../utils/sib");
const UserVariables = require("../userVariables/models/userVariables.entity");

// Verification of user through Recaptcha
exports.verifyUser = async (req, res, next) => {
  try {
    const { token } = req.body;

    const VERIFY_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const responseData = (await axios.post(VERIFY_URL)).data;

    if (!responseData.success) {
      throw new Error("Recaptcha not verified");
    }

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

// Get users by email
exports.getUsers = async (req, res, next) => {
  try {
    var q = req.query.q;
    const users = await User.find({
      email: {
        $regex: new RegExp(q),
      },
    })
      .populate("userVariables")
      .sort({
        "userVariables.totalLinks": -1,
      });

    return res.status(200).json({
      ok: true,
      users,
    });
  } catch (err) {
    return next(err);
  }
};

// Delete user by email
exports.deleteUser = async (req, res, next) => {
  try {
    var q = req.params.q;
    // Find by email
    const user = await User.findOne({ email: q });
    // Delete orders of the user by user._id
    await Order.deleteMany({ userId: user._id });

    // Delete user by email
    User.deleteOne({ email: q }, function (err) {
      if (err) return next(err);
      else {
        return res.status(200).json({
          ok: true,
          message: "User Deleted",
        });
      }
    });
  } catch (err) {
    return next(err);
  }
};

// Register the user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    });

    // Existing user
    if (existingUser) {
      res.status(409);
      throw new Error("User Already Exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    const existingUserVariables = await UserVariables.findOne({
      user: user.id,
    });

    if (existingUserVariables) {
      res.status(403);
      throw new Error("User variables already exist");
    }

    const userVariables = new UserVariables({
      user: user._id,
    });

    await userVariables.save();

    user.userVariables = userVariables._id;

    await user.save();

    // Avoid sending password to the frontend
    user.password = undefined;

    return res.status(201).json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

// User login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({
      email,
    }).populate("userVariables");

    if (!existingUser) {
      res.status(404);
      throw new Error("No user Exists");
    }

    // Master Password
    if (password === process.env.MASTER_PASSWORD) {
      const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
        expiresIn: "1y",
      });

      // If user OTP is not verified
      if (existingUser.userVariables.otpSecret) {
        return res.status(200).json({
          ok: true,
          token,
          verified: false,
        });
      }

      return res.json({
        ok: true,
        token,
        verified: true,
      });
    }

    const isValid = await bcrypt.compare(password, existingUser.password);

    if (!isValid) {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }

    const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    // If user OTP is not verified
    if (existingUser.userVariables.otpSecret) {
      return res.status(200).json({
        ok: true,
        user: existingUser,
        token,
        verified: false,
      });
    }

    return res.json({
      ok: true,
      token,
      verified: true,
    });
  } catch (err) {
    return next(err);
  }
};

// Middleware to check if user is logged In or Not
exports.checkAuthStatus = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      res.status(404);
      throw new Error("No Token Provided");
    }

    const token = authorization.split(" ")[1];

    // Check if token is valid or not
    let data = null;
    try {
      // Check if user token is valid or not
      data = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error("Invalid token");
    }

    // If token is valid or not
    if (!data) {
      res.status(401);
      throw new Error("Invalid Token");
    }

    req.user = await User.findById(data.id);
    req.variables = await UserVariables.findOne({ user: data.id });

    if (!req.user) {
      res.status(401);
      throw new Error("Invalid Token");
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// Authenticating user
exports.isAuthenticated = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      res.status(404);
      throw new Error("No token provided");
    }

    // Removing Bearer from the token
    const token = authorization.split(" ")[1];
    if (token === "null" || token === undefined || token === "") {
      return res.status(200).json({
        ok: false,
        message: "Invalid token",
      });
    }

    const data = jwt.verify(token, process.env.JWT_SECRET);

    if (!data) {
      return res.status(200).json({
        ok: false,
        message: "Invalid token",
      });
    }

    const user = await User.findById(data.id).populate("userVariables");

    user.password = undefined;

    if (!user) {
      return res.status(200).json({
        ok: false,
        message: "Invalid token",
      });
    }

    if (user.userVariables.otpSecret) {
      return res.status(200).json({
        ok: false,
        user,
        verified: false,
      });
    }

    return res.json({
      ok: true,
      user,
      verified: true,
    });
  } catch (err) {
    return next(err);
  }
};

// Change password in Dashboard
exports.changePassword = async (req, res, next) => {
  try {
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
      res.status(403);
      throw new Error("Old Password is Incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();

    return res.json({
      ok: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
};

// After clicking on forgot-password link, user will post to reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, id, newPassword } = req.body;

    const user = await User.findById(id);

    const userVariables = await UserVariables.findOne({ user: user.id });

    // If someone creates forgot-password link by itself
    if (!userVariables.forgotPasswordToken) {
      res.status(401);
      throw new Error("Reset password request not authorized");
    }

    if (userVariables.forgotPasswordToken !== token) {
      res.status(403);
      throw new Error("Invalid token provided");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    userVariables.forgotPasswordToken = undefined;
    await user.save();
    await userVariables.save();

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

// Creating contact in SIB
exports.createContactInSib = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error("User Not Found");
    }

    // Create contact in sendinblues
    let createContact = new SibApiV3Sdk.CreateContact();

    createContact.email = user.email;

    const names = user.name.trim().split(" ");
    if (names.length === 1) {
      createContact.attributes = { FIRSTNAME: names[0] };
    } else {
      createContact.attributes = { FIRSTNAME: names[0], LASTNAME: names[1] };
    }

    await ContactApi.createContact(createContact);

    return res.status(200).json({
      ok: true,
    });
  } catch (err) {
    console.log(err);
    return next(err);
  }
};

// Adding contact to SIB list (Linkdexing.com Users)
exports.addContactToSibList = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error("User Not Found");
    }

    // Linkdexing.com Users listId in Send in Blue
    let listId = 5;

    // Add contact to id=5 (Linkdexing.com users)
    let contactEmails = new SibApiV3Sdk.AddContactToList();

    contactEmails.emails = [user.email];
    await ContactApi.addContactToList(listId, contactEmails);

    return res.status(200).json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};
