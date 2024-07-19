class AppError extends Error{// bar bar res.status and all pura nhi likhna pade islily yeh banaya h
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4')?'fail':'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;