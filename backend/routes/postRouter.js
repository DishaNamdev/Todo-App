const postController = require("../controllers/postController");
const userController = require("../controllers/userController");
const express = require("express");
const router = express.Router();

router.route("/count").get(userController.protect, postController.totalTasksCount);

router
  .route("/:id")
  .get(postController.getTask)
  .patch(postController.updateTask)
  .delete(postController.deleteTask);


router
  .route("/")
  .get(userController.protect,postController.getAllTasks)
  .delete(postController.deleteAllTasks)
  .post(postController.postTask);


module.exports = router;
