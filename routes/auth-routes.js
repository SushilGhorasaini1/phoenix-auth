const express = require("express");

const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/auth-controllers");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh-token", refreshToken);

router.delete("/logout", logout);

module.exports = router;
