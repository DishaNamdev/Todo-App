const taskController = require('../controllers/taskController');
const authController = require('../controllers/authController');
const express = require('express');
const router = express.Router();


router.route('/signup').post(authController.register)

router.route('/login').post(authController.login);

router.route('/forgotPassword').get(authController.forgotPassword);

router.route('/updateMe').get(taskController.protectRoute, authController.updateMe);

router.route('/resetPassword/:token').patch(authController.resetPassword);

module.exports = router;