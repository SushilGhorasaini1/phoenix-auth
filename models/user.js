const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const createError = require("http-errors");

const Schema = mongoose.Schema;

const UserSchema = Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    true: String,
  },
  profilePhoto: {
    type: String,
  },
});

UserSchema.pre("save", async function () {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(this.password, salt);
    this.password = hashedpassword;
  } catch (error) {
    throw createError.InternalServerError();
  }
});

UserSchema.methods.verifyPassword = async function (password) {
  try {
    const passwordMatched = await bcrypt.compare(password, this.password);
    return passwordMatched;
  } catch (error) {
    throw createError.InternalServerError();
  }
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
