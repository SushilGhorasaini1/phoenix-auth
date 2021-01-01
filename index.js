const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth-routes");
const { verifyAccessToken } = require("./helpers/jwt-helpers");

require("dotenv").config();
require("./helpers/init-mongodb");
require("./helpers/init-redis");

const app = express();


app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());

app.get("/", verifyAccessToken, async (req, res, next) => {
  res.send("Welcome to Phoenix Authentication API.");
});

app.use("/auth", authRoutes);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use(async (err, req, res, next) => {
  res.status(err.statusCode || 500);
  res.send({
    error: {
      status: err.statusCode || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Service running on PORT: ${PORT}`);
});
