const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

const app = express();

app.use((req,res,next)=>{
    console.log("inside taskRoutes.js");
    next();
});

router.route("/allTasks").get(taskController.protectRoute, taskController.getAllTasksOfUser);

router.route('/taskCount').get(taskController.protectRoute, taskController.getAllTaskCount);

router.route("/").get()
                 .post(taskController.protectRoute, taskController.createTask);

router.route("/:taskId").patch(taskController.protectRoute, taskController.updateTask)
                        .delete(taskController.protectRoute, taskController.deleteTasks)
                        .get(taskController.getTask);



module.exports = router; 
