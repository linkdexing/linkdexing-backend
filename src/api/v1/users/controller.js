const bcrypt = require("bcryptjs");
const axios = require("axios");
const { totp } = require("otplib");
const { v4 } = require("uuid");
var SibApiV3Sdk = require("sib-api-v3-sdk");
const jwt = require("jsonwebtoken");
const User = require("./models/user.entity");
const Order = require("../orders/models/order.entity");
const { TransactionalEmailsApi, ContactApi } = require("../../../utils/sib");

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
    });

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
      if (existingUser.otpSecret) {
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
    if (existingUser.otpSecret) {
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
      try {
        // Check if Admin token is valid or not
        jwt.verify(token, process.env.JWT_ADMIN_SECRET);
        return next();
      } catch (error) {
        return next(error);
      }
    }

    // If token is valid or not
    if (!data) {
      res.status(401);
      throw new Error("Invalid Token");
    }

    req.user = await User.findById(data.id);

    if (!req.user) {
      res.status(401);
      throw new Error("Invalid Token");
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// Middleware to check whether the user is restricted or not
exports.isNotRestrict = async (req, res, next) => {
  try {
    if (req.user.isRestrict) {
      res.status(403);
      throw new Error("Account Restricted");
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
};

// Restrict user in Admin Panel
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

    const user = await User.findById(data.id);

    user.password = undefined;

    if (!user) {
      return res.status(200).json({
        ok: false,
        message: "Invalid token",
      });
    }

    if (user.otpSecret) {
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

// Send Forgot Password link
exports.sendForgotPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error(
        "User doesn't exist. Please check the email address provided"
      );
    }

    // Sending Reset Email to user
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const userToken = v4();

    user.forgotPasswordToken = userToken;

    await user.save();

    sendSmtpEmail.sender = { email: "noreply@linkdexing.com" };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = "Reset Password Link";
    sendSmtpEmail.textContent = `Hi there! We received a password reset request. If that was not you, please contact support. \nYour reset link is: ${process.env.FRONTEND_URL}/reset-password?id=${user.id}&token=${userToken}`;

    await TransactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    return res.json({
      ok: true,
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

    // If someone creates forgot-password link by itself
    if (!user.forgotPasswordToken) {
      res.status(401);
      throw new Error("Reset password request not authorized");
    }

    if (user.forgotPasswordToken !== token) {
      res.status(403);
      throw new Error("Invalid token provided");
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

// Send OTP
exports.sendOtp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      res.status(404);
      throw new Error("User doesn't exist");
    }

    // Sending OTP to user's email
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const otpSecret = v4();

    user.otpSecret = otpSecret;

    await user.save();

    // OTP valid for 10 minutes
    totp.options = { digits: 6, step: 600 };

    const otp = totp.generate(otpSecret);

    sendSmtpEmail.sender = { email: "noreply@linkdexing.com" };
    sendSmtpEmail.to = [{ email: user.email }];
    sendSmtpEmail.subject = "Verify your account";
    sendSmtpEmail.textContent = `Hi there! Your OTP is ${otp}`;

    await TransactionalEmailsApi.sendTransacEmail(sendSmtpEmail);

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

// Verifying OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { otp } = req.body;

    const user = await User.findById(id);

    if (!user.otpSecret) {
      res.status(401);
      throw new Error("No verification request found");
    }

    const isValid = totp.verify({ token: otp, secret: user.otpSecret });

    if (!isValid) {
      res.status(401);
      throw new Error("OTP could not be verified Please try again");
    }

    // OTP is verified, remove OTP Secret
    user.otpSecret = undefined;
    await user.save();

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
