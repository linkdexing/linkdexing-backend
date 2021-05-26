const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("./models/user.entity");
const Order = require("../orders/models/order.entity");

exports.getUsers = async (req, res, next) => {
  try {
    var q = req.query.q;
    const users = await User.find({
      email: {
        $regex: new RegExp(q),
      },
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

// exports.search = aysnc(req,res)=>{
//   const {email} = this.getUsers().email;
//   User.find({email})
// }

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
      console.log("gvgvg");
      return next();
    }

    if (!data) {
      return res.status(401).json({
        ok: false,
        message: "Invalid token",
      });
    }

    // if (data.superAdmin) {
    //   req.superAdmin = true;

    //   return next();
    // }

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
