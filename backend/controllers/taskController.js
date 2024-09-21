const User = require("../models/userModel");
const AppError = require("../utils/appError.js");
const Task = require("../models/tasksModel");
const promisify = require("util").promisify;
const jwt = require("jsonwebtoken");
const { connect } = require("http2");

exports.getTask = (req, res) => {};

exports.updateTask = async(req, res) => {
  if(!req.params){
    return new AppError("params doesn't exists",404);
  }
  if(!req.body){
    return new AppError("input doesn't exists",404);
  }

  try{
    const task = await Task.findByIdAndUpdate(req.params.taskId, req.body, {new: true});
    return res.status(201).json({
      status: "success",
      data:{
        task
      }
    })
  }catch(err){
    return res.status(404).json(
      {
        status: "error",
        message: "task not found or cannot be updated!"
      }
    )
  }
};

exports.createTask = async (req, res) => {
  try {
    //    const {title, description, endDate} = req.body;
    console.log("inside the createTask method");
    const { _id } = req.user;
    const taskObj = { ...req.body, user: _id };
    console.log("inside the createTask method 2");
    console.log("user inside the request object: ", req.user);

    const newTask = await Task.create(taskObj);
    console.log("inside the createTask method 3");
    res.status(201).json({ status: "success", data: { task: newTask } });
  } catch (err) {
    res.status(400).json({ status: "error", err: err.message });
  }
};

exports.deleteTasks = async (req, res) => {
  if (!req.params?.taskId) {
    return AppError(404, "task id not found!");
  }
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    return res.status(200).json("Task deleted successfully!");
  } catch (err) {
    return new AppError(404, err.message);
  }
};

exports.getAllTasksOfUser = async (req, res) => {
  try {
    console.log("insde the getAllTaskOfUser");
    if (!req.user)
      return new AppError("User doesn't exists in the request object.", 404);

    let sortField = req.query.sort;
    if (!req.query.sort) {
      sortField = "-createdAt";
    }

    let limit = 5;
    let skip = 0;
    if (req.query.page) {
      if (req.query.limit) limit = req.query.limit;
      const pages = req.query.page * 1 || 1;
      skip = limit * (pages - 1);
    }
    const tasks = await Task.find({ user: req.user._id })
      .sort(sortField)
      .skip(skip)
      .limit(limit);
    if (!tasks) {
      return new AppError("tasks doesn't exists", 404);
    }
    res.status(200).json({
      status: "success",
      data: {
        tasks: tasks || [],
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getAllTaskCount = async(req,res) => {
  try{
    const { _id } = req.user;
    const taskCount = await Task.countDocuments({user: _id});
    return res.status(200).json({
      status: 'success',
      count: taskCount, 
    });
  }catch(err){
    return res.status(404).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.protectRoute = async (req, res, next) => {
  let token = null;
  console.log("inside protectRouteeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  //if the user has login and has token
  if (!token) {
    // return new AppError("You are not logged in. Please login first!", 401);
    return res.status(401).json({
      status: "error",
      message:  "You are not logged in. Please login first!",
    });
  }

  //if the token is valid
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    if (!decoded) {
      return new AppError("Invalid Token! Please login again");
    }
    console.log("checking the flow till decoded");
  } catch (err) {
    console.log("error while decoding..");
    return next(new AppError(err.message));
  }

  //if the user with the id present inside the token exists
  const userOfDecodedId = await User.findById(decoded.id);
  console.log("checking the flow till decoded 2");

  if (!userOfDecodedId) {
    return new AppError("User doesn't exists!");
  }

  //check if the user has changed after the token was issued
  if (userOfDecodedId.changedPasswordAfter(decoded.iat)) {
    return new AppError("Login again! Password was changed");
  }
  req.user = userOfDecodedId;
  console.log("checking flow, req.user", req.user);
  next();
};
