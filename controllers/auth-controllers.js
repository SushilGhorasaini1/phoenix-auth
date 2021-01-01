const createError = require("http-errors");

const { authSchema } = require("../helpers/validation-schemas");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt-helpers");

const redisClient = require("../helpers/init-redis");

const User = require("../models/user");

module.exports = {
  register: async (req, res, next) => {
    try {
      //Validating User's Input
      const result = await authSchema.validateAsync(req.body);
      //Checking whether user already exists in the database
      const doesExist = await User.findOne({ email: result.email });
      //Throwing error if user aleardy exists
      if (doesExist)
        throw createError.Conflict(
          `${result.email} has already been registered.`
        );
      const user = User({ email: result.email, password: result.password });
      //Saving User in the database
      const savedUser = await user.save();
      //generating accessToken for the user
      const accessToken = await signAccessToken(savedUser.id);
      //generating refreshToken for the user
      const refreshToken = await signRefreshToken(savedUser.id);
      //Sending user response
      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.statusCode = 422;
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      //Validating user's request
      const result = await authSchema.validateAsync(req.body);
      //Checking if user exists in the database
      const user = await User.findOne({ email: result.email });
      //Throwing error if user doesn't exist in the database
      if (!user)
        throw createError.NotFound(`${result.email} has not been registered.`);
      //Checking if given password is correct
      const isValidPassword = await user.verifyPassword(result.password);
      //Throwing error if password in not valid
      if (!isValidPassword)
        throw createError.BadRequest("Email/Password is incorrect.");
      //Generating accessToken for the user
      const accessToken = await signAccessToken(user.id);
      //generating refreshToken for the user
      const refreshToken = await signRefreshToken(user.id);

      res.send({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.UnprocessableEntity("Invalid Email/Password."));

      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.Unauthorized();

      const userId = await verifyRefreshToken(refreshToken);
      //Generating accessToken for the user
      const accessToken = await signAccessToken(userId);
      //generating refreshToken for the user
      const newRefreshToken = await signRefreshToken(userId);
      res.send({ accessToken: accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      //checking if refreshToken is passed
      if (!refreshToken) throw createError.BadRequest();
      //verifying refreshToken and getting userId
      const userId = await verifyRefreshToken(refreshToken);
      //deleting current refreshToken from redis server
      redisClient.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
        res.sendStatus(204);
      });
    } catch (error) {
      next(error);
    }
  },
};
