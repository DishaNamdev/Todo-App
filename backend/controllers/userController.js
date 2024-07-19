const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const util = require("util");
const sendEmail = require("./../utils/email");
const crypto = require("crypto");
const { promisify } = util;

const filterObj = (userObj, ...alllowedFields) => {
  const newObj = {};
  Object.keys(userObj).forEach((el) => {
    if (alllowedFields.includes(el)) newObj[el] = userObj[el];
  });
  return newObj;
};

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = async (req, res) => {
  console.log("Entering the login function");
  const { email, password } = req.body;
  console.log("email and password", email, password);

  //1) check if the email and password exists
  if (!email || !password) {
    return res
      .status(400)
      .json({ status: "error", message: "Please provide email and password" });
  }

  //2) check if the user exists and password is correct
  const user = await User.findOne({ email: email }).select("+password");
  //   const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res
      .status(401)
      .json({ status: "error", message: "Incorrect email or password" });
  }

  //3) If everything ok, send token to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
};

exports.register = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirmation: req.body.passwordConfirmation,
    });

    const token = signToken(newUser._id);
    //   jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    //     expiresIn: process.env.JWT_EXPIRES_IN,
    //   });

    const { password, active, ...restUserProp } = newUser;

    res.status(201).json({
      status: "success",
      token: token,
      data: {
        user: restUserProp,
      },
    });
  } catch (err) {
    res.status(404).json({ status: "error", message: err.message });
  }
};

exports.protect = async (req, res, next) => {
  //1) Getting the token and check if its there
  //   console.log(req.headers);
  let token = "";
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json("You are not logged in! Please log in to get the access");
  }

  //2) verification of the token
  let decoded;
  try {
    // console.log("Here is the token",token);
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //1) to make this function jwt.verify to return a promise we are using promisify method here.
    console.log("decoded value", decoded);
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid token!! Please login again!", err: err });
  }

  //3) check if user still exists
  const UserBasedOnDecodedId = await User.findById(decoded.id); //(2)
  if (!UserBasedOnDecodedId) {
    return res
      .status(401)
      .json("The user belonging to this token does no longer exists");
  }

  //4) check if the user changed the password  after the token was issued.
  if (UserBasedOnDecodedId.changedPasswordAfter(decoded.iat)) {
    //(3)
    return res
      .status(401)
      .json("User recently changed password! Please login again.");
  }

  req.user = UserBasedOnDecodedId;
  next();
};

exports.forgotPassword = async (req, res, next) => {
  //1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res
      .status(401)
      .json({ message: "There is no user with that email" });
  }

  //2) generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //(4)

  //3) send it back to the user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n 
  If you didn't forget your password, please ignore this email. `;

  try {
    await sendEmail({
      email: user.email,
      message: message,
      subject: "Your password reset token (valid for 10 min)",
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res
      .status(500)
      .json("There was an error sending the email. Try again later!");
  }
};

exports.resetPassword = async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); //(5)

  // 2) if token has not expired and there is user, set the new password
  if (!user) {
    return res.status(404).json("Token is invalid or expired!!");
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) update the changedPasswordAt property for the user

  //4) log the user in, send JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
};

exports.updatePassword = async (req, res, next) => {
  //(1) get the user from the collection
  const user = await User.findById(req.user.id).select("+password"); //(6)

  //2) check if the POSTed current password is correct
  if (!user.correctPassword(req.body.passwordCurrent, user.password)) {
    return res
      .status(401)
      .json("Wrong Password! Please enter correct password");
  }

  //3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.save();

  //4) Log the user in, send JWT
  const token = signToken(user._id);
  return res
    .status(200)
    .json({ status: "Password updated successfully!!", token });
};

exports.updateMe = (req, res) => {
  //(7)
  //check password is not present in the body.
  if (req.body.password || req.body.passwordConfirm) {
    return res
      .status(400)
      .json("Please hit /updateMyPassword route for updating the password");
  }

  //updating the user
  const filteredBody = filterObj(req.body, "name", "email");
  const updatedUser = User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: "success", data: updatedUser });
};

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { select: false });
  res.status(204).json({ status: "success", data: null });
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
};

/**
 * (1) here promisify is the function which will turn the object return by jwt.verify into promise and will return the decoded requried "data" from that promise object.
 *  we are checking if somebody has not changed the id.
 *
 * (2) checking if the token beloging to the user, hasn't deleted its account. Otherwise somebody can stole the token of the previously exists user and can login on their name
 *
 * (3) let say somebody has stolen the jsonwebtoken of a user and in order to protect his data user changes the password, so here in this part we need to make sure that
 * the somebody else with the old token is not able to login into the user's account.
 *
 * (4) here we need to pass validateBeforeSave to false because, we have kept email and password as the mandatory fields and here we are saving the data that means the passwordREsetToken
 * and passwordResetTokenExpires in the database without again providing email and password, so if we don't set this then the save method will demand it. thefore, set that to false to avoid the
 * requried check on email and password.
 *
 * (5) in the find one method we have passed the token for find the user, here we are checking whether any user with that token exists and also we are checking if the token has not expired or not.
 * for checking the token expiration we are comparing the tokenExpiration time with the current time.
 * Current timing is sent in the date format and tokenExpiration is written in the miliseconds, so mongodb will automatically convert them into one type and will compare it.
 *
 * (6) on the req object we would already be having current user therefore, we did req.user.id and since we already set select: false in the userSchema we need to say explicitly include password.
 *
 * NOTE: we should never use findByIdandUpdate for anything related to the password, reason for this is, the this.password is available only with save and create method becuase, mongoose doesn't keep the
 * record of current user so this.passowrd written in the validators inside the user model won't work in that case.
 * Also the pre.save middlewares doens't work in which we have written the code for encypting the password and checking if the there is any change inside the password.
 *
 * (7)  when we talk about deleting the user, we actually don't delete the user, instead we just set that user to inactive inside the db so if
 * in the future, the user again wants to activate the account then it can do that.
 */
