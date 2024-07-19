const userController = require("../controllers/userController");
const express = require('express');
const router = express.Router();

router.post("/login", userController.login);

// router.route("/register").post(userController.register);
router.post('/register', userController.register);

router.post("/forgotPassword", userController.forgotPassword);

router.patch("/resetPassword/:token", userController.resetPassword);

router.patch('/updateMyPassword',userController.protect, userController.updatePassword);

router.patch('/updateMe', userController.protect, userController.updateMe);

router.delete('/deleteMe', userController.protect, userController.deleteMe);

router.get('/allUsers', userController.getAllUsers);

module.exports = router;