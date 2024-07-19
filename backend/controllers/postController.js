const Task = require("../models/postModel");

const catchAsync = fn => {
  return ()=>{
    fn(req,res,next).catch(err=> next(err));
  }
}

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    res.status(200).json({
      status: "success",
      data: task,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err,
    });
  }
};

exports.getAllTasks = catchAsync(async (req, res) => {
  // try {
    let sortField = req.query.sort ;
    if(!req.query.sort){
      sortField = '-createdAt';
    }
    //implementing pagination
    const pages = req.query.page*1 || 1;
    const limit = 5;
    const skip = (pages-1)*limit
    const tasks = await Task.find().sort(sortField).skip(skip).limit(limit);

    res.status(200).json({
      status: "success",
      data: tasks,
    });
  // } catch (err) {
  //   res.status(404).json({
  //     status: "error",
  //     message: err,
  //   });
  // }
});

exports.totalTasksCount = async(req,res)=>{
  try{
    const tasksCount = await Task.countDocuments({});
    res.status(200).json({data: tasksCount});
  }catch(err){
    res.status(404).json({status: "error",message: err.message});
  }
}

exports.postTask = async (req, res) => {
  // console.log(req.body);
  try {
    const task = await Task.create(req.body);
    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    res.status(202).json({
      status: "success",
      id: req.params.id,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err,
    });
  }
};

exports.deleteAllTasks = async (req, res) => {
  try {
    await Task.deleteMany({});
    res.status(202).json({
      status: "success",
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err,
    });
  }
};
