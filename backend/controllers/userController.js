const AppError = require("../utils/appError");
const User = require("../models/userModel");
const multer = require("multer");
const sharp = require('sharp');

const filterObj = (obj, ...allowedFields) => {
    let newObj = {};
    Object.keys(obj).forEach((field) => {
      if (allowedFields.includes(field)) newObj[field] = obj[field];
    });
    return newObj;
  };
  
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },

//   filename: (req, file, cb) => {
//     const extn = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${extn}`);
//   },
// });

const multerStorageMemory = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images", 400), false);
  }
};

const upload = multer({
  storage: multerStorageMemory,
  fileFilter: multerFilter,
});

// export const uploadProfilePic = multer.upload.single('photo');// commenting out this because we're using another approach.
exports.uploadProfilePic = upload.single("photo");

exports.resizeProfilePic = (req, res, next) =>{

    if(!req.file) return;

    const extn = req.file.mimetype.split('/')[1];
    const filename = `user-${req.user._id}-${Date.now()}.${extn}`;
    req.file.filename = filename;

    sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({ quality:90 })
        .toFile(`public/img/users/${req.file.filename}`);
    
    next();    
}

exports.createUser = async (req, res) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    res.status(201).json({
      status: "user created successfully!",
      data: {
        user: user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
    });
  }
};

exports.updateUser = async (req, res) => {
  console.log(req.file);
  console.log(req.body);
  try {
    if (req.body.password || req.body.confirmPassword) {
        return next(
            new AppError("This route is not for password updates. Please user /updateMyPassword", 400)
        );
    }
      let filteredObj = filterObj(JSON.parse(req.body.data), "name", "email");
      
      //adding the filename to the database.
      if(req.file){
        filteredObj.photo = req.file.filename;
      }

      //saving the image name to the database
      const user = await User.findByIdAndUpdate(req.user._id, filteredObj, {
        new: true,
      });
      return res.status(200).json({
        status: "success",
        data: {
          user: user,
        },
      });
    // }
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    if (req.params.userId) {
      const reqUser = await User.findById(req.params.userId);
      res.status(200).json({
        status: "fail",
        data: {
          user: reqUser,
        },
      });
    } else {
      throw new Error("Cannot find the userId");
    }
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: "Cannot find user with that userId",
      error: err,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ active: true });
    res.status(200).json({
      status: "success",
      data: {
        users: users,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.params.userId,
      { active: false },
      { new: true }
    );
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
};
