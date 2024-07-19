const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require('../controllers/authController');

router
  .route("/")
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
  .route("/:userId")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


router.route('/signup').post(authController.register)
router.route('/login').post(authController.login);

module.exports = router;
