const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const taskController = require("../controllers/taskController");

const multer = require('multer');
const upload = multer({dest: 'public/img/users'});

router
    .route("/")
    .get(userController.getAllUsers)
    .post(userController.createUser)
    .patch(taskController.protectRoute, userController.uploadProfilePic, userController.resizeProfilePic, userController.updateUser)

router
  .route("/:userId")
  .get(userController.getUser)
  .delete(userController.deleteUser);

module.exports = router;
