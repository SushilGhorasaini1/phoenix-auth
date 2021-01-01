const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const redisClient = require("./init-redis");

module.exports = {
  signAccessToken: async (userId) => {
    const SECRET = process.env.ACCESS_TOKEN_SECRET;
    const ISSUER = process.env.ISSUER;

    const payload = {};

    const options = {
      expiresIn: "1m",
      issuer: ISSUER,
      audience: userId,
    };

    return new Promise((resolve, reject) => {
      jwt.sign(payload, SECRET, options, (err, token) => {
        if (err) return reject(createError.InternalServerError());
        return resolve(token);
      });
    });
  },
  verifyAccessToken: async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) throw createError.Unauthorized();
      const bearerHeader = authHeader.split(" ");
      const token = bearerHeader[1];

      const SECRET = process.env.ACCESS_TOKEN_SECRET;

      jwt.verify(token, SECRET, (err, payload) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "Unauthorized" : "Jwt Expired";
          throw createError.Unauthorized(message);
        }
        req.payload = payload;
        next();
      });
    } catch (error) {
      next(error);
    }
  },
  signRefreshToken: async (userId) => {
    const SECRET = process.env.REFRESH_TOKEN_SECRET;
    const ISSUER = process.env.ISSUER;

    const payload = {};

    const options = {
      expiresIn: "30d",
      issuer: ISSUER,
      audience: userId,
    };

    return new Promise((resolve, reject) => {
      jwt.sign(payload, SECRET, options, (err, token) => {
        if (err) return reject(createError.InternalServerError());

        redisClient.SET(userId, token, (error, reply) => {
          if (error) return reject(createError.InternalServerError());
          console.log(reply);
        });

        return resolve(token);
      });
    });
  },
  verifyRefreshToken: async (refreshToken) => {
    const SECRET = process.env.REFRESH_TOKEN_SECRET;
    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, SECRET, (err, payload) => {
        if (err) return reject(createError.Unauthorized());
        const userId = payload.aud;

        redisClient.GET(userId, (err, result) => {
          if (err) return reject(createError.InternalServerError());
          if (refreshToken === result) return resolve(userId);

          return reject(createError.Unauthorized());
        });
      });
    });
  },
};
