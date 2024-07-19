module.exports = (err,req,res,next)=>{// to handle the interal server error this global error handler is created.
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    })
}