const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({

    title: {
        type: String,
        required: [true, 'Task title is required!']
    },

    description: {
        type: String,
        required: [true, 'Task description is requried']
    },

    createdAt: {
        type: Date,
        default: Date.now()+1,
    },

    endDate : {
        type: Date,
        required: [true, 'End date is required']
    },

    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'userModel'
    },
});

const Task = mongoose.model('taskModel',taskSchema);

module.exports = Task;