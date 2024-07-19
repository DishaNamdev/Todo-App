const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const createToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.login = async (req, res) => {
  try {
    if (req.body.email && req.body.password) {
      const user = await User.findOne({ email: req.body.email }).select("+password");
      if (!user) throw new Error("User with this email doesn't exists");

      if (!(await user.checkEnteredPassword(req.body.password, user.password))) {
        return res.status(401)
          .json({
            status: "error",
            message: "Incorrect password! Check your password",
          });
      }
      const token = createToken(user);
      res.status(200).json({
        status: "success",
        token,
      });
    }
  } catch (err) { 
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
