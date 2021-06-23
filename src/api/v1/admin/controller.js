const jwt = require("jsonwebtoken");
const UserVariables = require("../userVariables/models/userVariables.entity");

exports.isAuthenticated = async (req, res) => {
  if (req.admin) {
    return res.json({
      ok: true,
    });
  }

  return res.status(200).json({
    ok: false,
  });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      try {
        const token = jwt.sign({ admin: true }, process.env.JWT_ADMIN_SECRET, {
          expiresIn: "365d",
        });

        return res.json({
          ok: true,
          token,
          admin: true,
        });
      } catch (err) {
        return next(err);
      }
    }

    return res.status(404).json({
      ok: false,
      message: "Invalid email or password",
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

    const data = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    if (!data) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    if (data.admin) {
      req.admin = true;

      return next();
    }

    return res.status(401).json({
      ok: false,
      message: "Invalid token",
    });
  } catch (err) {
    return next(err);
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        ok: false,
        message: "Only admin can access this route",
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

exports.changeUserLinksLimit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit } = req.body;

    if (limit < 0) {
      throw new Error("Limit cannot be less than 0");
    }

    const userVariables = await UserVariables.findOne({ user: userId });

    userVariables.monthlyLimit = limit;

    await userVariables.save();

    return res.json({
      ok: true,
    });
  } catch (err) {
    return next(err);
  }
};
