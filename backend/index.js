const express = require('express');
const app = express();
const taskRoutes = require('./routes/taskRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const globalErrorHandler = require('./controllers/errorController.js');
const cors = require('cors');
const AppError = require('./utils/appError.js');

app.use(cors());
app.use(express.json());


// app.get('/', (req,res)=>{
//     res.send("this is the response");
// })

// app.get('/api',(req,res)=>{
//     res.json({message: 'this is my message'});
// })

app.use((req,res,next)=>{
    console.log("inside index.js/backend");
    next();
})

app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", userRoutes);

app.all("*", (req,res,next)=>{
    // res.status(404).send(`Cannot find route for this ${req.originalUrl}`);
    const error = new AppError(`Cannot find route for this ${req.originalUrl}`,404);
    next(error);
});

//global error handler- agr koi server error aaya to chalega
app.use(globalErrorHandler);
module.exports = app;