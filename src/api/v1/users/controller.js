const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("./models/user.entity");

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    return res.status(200).json({
      ok: true,
      users,
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

    const user = new User({
      name,
      email,
      password,
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

    // if (
    //   email === process.env.SUPER_ADMIN_EMAIL &&
    //   password === process.env.SUPER_ADMIN_PASSWORD
    // ) {
    //   const token = jwt.sign({ superAdmin: true }, process.env.JWT_SECRET, {
    //     expiresIn: "365d",
    //   });

    //   return res.json({
    //     ok: true,
    //     token,
    //     superAdmin: true,
    //     role: "superAdmin",
    //   });
    // }

    const existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "No user exists",
      });
    }

    const isValid = await argon2.verify(existingUser.password, password);

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

  //   if (data.superAdmin) {
  //     req.superAdmin = true;

  //     return next();
  //   }

  req.user = await User.findById(data.id);

  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: "Invalid token",
    });
  }

  return next();
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

    // if (data.superAdmin) {
    //   return res.json({
    //     ok: true,
    //     superAdmin: true,
    //     role: "superAdmin",
    //   });
    // }

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

  const isValid = await argon2.verify(user.password, oldPassword);

  if (!isValid) {
    return res.status(403).json({
      ok: false,
      message: "Invalid Password",
    });
  }

  user.password = newPassword;

  await user.save();

  return res.json({
    ok: true,
    user,
  });
};

// exports.isSuperAdmin = (req, res, next) => {
//   try {
//     if (!req.superAdmin) {
//       return res.status(401).json({
//         ok: false,
//         message: "Only superadmin can access this route",
//       });
//     }

//     return next();
//   } catch (err) {
//     return next(err);
//   }
// };

// exports.isAdmin = (req, res, next) => {
//   try {
//     const { user } = req;

//     if (user.userType === "admin" && user.approved) {
//       next();
//     }

//     return res.status(401).json({
//       ok: false,
//       message: "Only admin can access this route",
//     });
//   } catch (err) {
//     return next(err);
//   }
// };

// exports.isUser = (req, res, next) => {
//   try {
//     const { user } = req;

//     if (user.userType === "user") {
//       return next();
//     }

//     return res.status(401).json({
//       ok: false,
//       message: "Only user can access this route",
//     });
//   } catch (err) {
//     return next(err);
//   }
// };
