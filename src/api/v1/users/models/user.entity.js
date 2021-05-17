const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 4,
  },
  email: {
    type: String,
    required: true,
    validate:
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  password: {
    type: String,
    required: true,
    validate: /^[0-9a-zA-Z]{4,}$/,
  },
});

userSchema.pre("save", async function (next) {
  const hashedPassword = await argon2.hash(this.password, { saltLength: 12 });

  this.password = hashedPassword;

  next();
});

module.exports = mongoose.model("user", userSchema);
