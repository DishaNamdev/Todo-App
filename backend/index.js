const express = require('express');
const app = express();
const taskRoutes = require('./routes/taskRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const globalErrorHandler = require('./controllers/errorController.js');
const cors = require('cors');
const AppError = require('./utils/appError.js');
const path = require('path');


app.use(cors());
app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

app.all("*", (req,res,next)=>{
    // res.status(404).send(`Cannot find route for this ${req.originalUrl}`);
    const error = new AppError(`Cannot find route for this ${req.originalUrl}`,404);
    next(error);
});

//global error handler- agr koi server error aaya to chalega
app.use(globalErrorHandler);
module.exports = app;