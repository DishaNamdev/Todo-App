const express = require('express');
const postRouter = require("./routes/postRouter");
const userRouter = require("./routes/userRouter");
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// app.use(morgan.json());

app.use(cors());

app.use(express.json());

app.use("/api/v1/tasks",postRouter);

app.use("/api/v1/users", userRouter);

app.all("*",(req,res,next)=>{
    // res.status(400).json({status: 'fail', message: `Cannot find ${req.originalUrl} on this server`});
    
    // const err = new Error(`Can't find ${req.originalUrl} on this server`);
    // err.status = 'fail';
    // err.statusCode = 404;

    // next(err);
    const error = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
    next(error);
})

// app.use((err,req,res,next)=>{
//     err.statusCode = err.statusCode || 'error';
//     err.status = err.status || 500;

//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message,
//     })

//     // next(err);
// })
app.use(globalErrorHandler);

module.exports = app;