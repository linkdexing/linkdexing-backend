const moment = require("moment");
const UserVariables = require("./models/userVariables.entity");

// Middleware to check whether the user is restricted or not
exports.isNotRestrict = async (req, res, next) => {
  try {
    if (req.variables.isRestrict) {
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
    const userVariables = await UserVariables.findOne({ userId: id });
    userVariables.isRestrict = req.body.option;
    await userVariables.save();

    return res.status(200).json({
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

    const userVariables = await UserVariables.findOne({ user: id }).populate(
      "user"
    );

    if (!userVariables) {
      res.status(404);
      throw new Error("User doesn't exist");
    }

    // Sending OTP to user's email
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const otpSecret = v4();

    userVariables.otpSecret = otpSecret;

    await userVariables.save();

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

// Send Forgot Password link
exports.sendForgotPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    const userVariables = await UserVariables.findOne({ user: user.id });

    if (!user) {
      res.status(404);
      throw new Error(
        "User doesn't exist. Please check the email address provided"
      );
    }

    // Sending Reset Email to user
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    const userToken = v4();

    userVariables.forgotPasswordToken = userToken;

    await userVariables.save();

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

// Verifying OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { otp } = req.body;

    const userVariables = await UserVariables.findOne({ user: id });

    if (!userVariables.otpSecret) {
      res.status(401);
      throw new Error("No verification request found");
    }

    const isValid = totp.verify({
      token: otp,
      secret: userVariables.otpSecret,
    });

    if (!isValid) {
      res.status(401);
      throw new Error("Invalid otp");
    }

    // List Id in SendInBlues
    let listId = 5;

    // Create contact in sendinblues
    let createContact = new SibApiV3Sdk.CreateContact();

    // Add contact to id=5 (Linkdexing.com users)
    let contactEmails = new SibApiV3Sdk.AddContactToList();

    createContact.email = user.email;
    const names = user.name.trim().split(" ");
    if (names.length === 1) {
      createContact.attributes = { FIRSTNAME: names[0] };
    } else {
      createContact.attributes = { FIRSTNAME: names[0], LASTNAME: names[1] };
    }
    contactEmails.emails = [user.email];

    await ContactApi.createContact(createContact);

    await ContactApi.addContactToList(listId, contactEmails);

    // OTP is verified, remove OTP Secret
    userVariables.otpSecret = undefined;
    await userVariables.save();

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};

exports.shouldResetLinks = async (req, res, next) => {
  try {
    const userVariables = req.variables;

    const lastResetDate = moment(userVariables.lastResetDate);

    const currentDate = moment(Date.now());

    if (lastResetDate.add({ days: 30 }).isSameOrAfter(currentDate)) {
      userVariables.monthlyUsed = 0;
      userVariables.lastResetDate = Date.now();
    }

    next();
  } catch (err) {
    return next(err);
  }
};
