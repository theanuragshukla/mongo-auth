const mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
  uid: String,
  created: {
    type: Date,
    default: Date.now,
  },
  modified: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  name: String,
  surname: String,
  email: String,
  password: String,
});

const resetPasswordSchema = new mongoose.Schema({
  uid: String,
  createdAt: { type: Date, expires: "5m", default: Date.now },
  resetString: String,
});

resetPasswordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  userSchema: new mongoose.model("user", userSchema, "auth-users"),
  resetPasswordSchema: new mongoose.model(
    "reset",
    resetPasswordSchema,
    "auth-passwordReset"
  ),
};
