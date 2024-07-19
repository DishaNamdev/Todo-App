const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title:{
        require: true,
        type: String,
    },

    desc: {
        type: String,
        required: [true, 'task description is required!!']
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false,
    }
});

const Task = mongoose.model('postSchema', postSchema);

module.exports = Task;