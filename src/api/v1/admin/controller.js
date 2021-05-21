const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (email === "jasmeet@gmail.com" && password === 1234567890) {
      const token = jwt.sign({ superAdmin: true }, process.env.JWT_SECRET, {
        expiresIn: "365d",
      });

      return res.json({
        ok: true,
        token,
        superAdmin: true,
        role: "superAdmin",
      });
    }

    // const existingUser = await User.findOne({
    //   email,
    // });

    // if (!existingUser) {
    //   return res.status(404).json({
    //     ok: false,
    //     message: "No user exists",
    //   });
    // }

    // const isValid = await argon2.verify(existingUser.password, password);

    // if (!isValid) {
    //   return res.status(401).json({
    //     ok: false,
    //     message: "Invalid Email/Password",
    //   });
    // }

    // const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, {
    //   expiresIn: "365d",
    // });

    // return res.json({
    //   ok: true,
    //   token,
    // });
  } catch (err) {
    return next(err);
  }
};

exports.checkAuthStatus = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(404).json({
      ok: false,
      message: "No token provided",
    });
  }
  const token = authorization.split(" ")[1];

  const data = jwt.verify(token, process.env.JWT_SECRET);

  if (!data) {
    return res.status(401).json({
      ok: false,
      message: "Invalid token",
    });
  }

  if (data.superAdmin) {
    req.superAdmin = true;

    return next();
  }

  req.user = await User.findById(data.id);

  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: "Invalid token",
    });
  }

  return next();
};

exports.isSuperAdmin = (req, res, next) => {
  try {
    if (!req.superAdmin) {
      return res.status(401).json({
        ok: false,
        message: "Only superadmin can access this route",
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    const { user } = req;

    if (user.userType === "admin" && user.approved) {
      next();
    }

    return res.status(401).json({
      ok: false,
      message: "Only admin can access this route",
    });
  } catch (err) {
    return next(err);
  }
};
