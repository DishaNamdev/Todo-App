const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const util = require("util");
const sendEmail = require("./../utils/email");
const AppError = require("../utils/appError");
const crypto = require('crypto');

const createToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const filterObj = (obj) => {
  const allowedFields = ["name", "email", "phoneno"];
  const filteredRes = {};
  Object.keys(obj).forEach((userF) => {
    if (allowedFields.includes(userF)) {
      filteredRes[userF] = obj;
    }
  });
  return filteredRes;
};

exports.login = async (req, res) => {
  try {
    if (req.body.email && req.body.password) {
      const user = await User.findOne({ email: req.body.email }).select("+password");
      console.log("Received email:", req.body.email);
      console.log("Received password:", req.body.password);
      

      if (!user) throw new Error("User with this email doesn't exists");

      if (
        !(await user.checkEnteredPassword(req.body.password, user.password))
      ) {
        return res.status(401).json({
          status: "error",
          message: "Incorrect password! Check your password",
        });
      }
      const token = createToken(user);
      res.status(200).json({
        status: "success",
        token,
        user,
      });
    }
  } catch (err) {
    console.log("checking>> ", req.body.email, req.body.password);
    res.status(401).json({ status: "error", message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!email || !password) {
      throw new Error("Email and Password are not present!!");
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      throw new Error("User with this email already exists!!");
    }

    const user = await User.create({
      email: email,
      password: password,
      name: name,
      confirmPassword: confirmPassword,
    });

    const token = createToken(user);

    res.status(201).json({ status: "success", token, data: { user: user } });
  } catch (err) {
    console.log("Error message: ", err.message);
    res.status(404).json({ status: "error", message: err.message });
  }
};

exports.forgotPassword = async (req, res, next) => {
  if (!req.body.email) {
    // return res.status(404).json({
    //   status: 'error',
    //   message: 'Email not found!'
    // });
    return next(new AppError("Email not found!", 404));
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "There is no user registered with this mail id!",
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n 
  If you didn't forget your password, please ignore this email. `;
  try {
    // await
     sendEmail({
      message: message,
      subject: "Your password reset token ( valid for 10 minutes )",
      email: user.email,
    });

    return res.status(200).json({
      status: "success",
      message: "password reset link send to the user email",
    });
  } catch (err) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json("There was an error sending the email. Try again later!");
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      // passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      // res.status(401).json({
      //   status: 'error',
      //   message: 'Token is invalid or expired!!'
      // });
      return next(new AppError("Token is invalid or expired!", 401));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully!'
    })
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message + `\n Couldn't find the user with this credentials`,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Login failed. Please login again!"));
  }

  const { email, password } = req.body;
  try {
    const user = await User.findById({ id: req.user._id }).select("+password");
    if (user.checkEnteredPassword(password, user.password)) {
      user.password = password;
      user.passwordChangedAt = Date.now();
      user.save();
    }

    const token = createToken(user);
    return res.status(200).json({
      status: "success",
      message: "Password updated successfully!",
      token,
    });
  } catch (err) {
    return res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.updateMe = async (req, res) => {
  if (!req.body.password) {
    return new AppError(
      "There's already a route defined for updating the password"
    );
  }

  const filteredbody = filterObj(req.body);
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredbody, {
    new: true,
    runValidator: true,
  });

  return res.status(200).json({
    status: "success",
    message: "User updated successfully!",
    updatedUser,
  });
};

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { select: false });
  return res.status(200).json("User deleted successfully!");
};
