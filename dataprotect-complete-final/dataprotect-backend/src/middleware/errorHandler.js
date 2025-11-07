const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let status = err.status || 500;
    let message = err.message || 'Internal server error';

    // SQLite constraint errors
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
        status = 409;
        if (err.message.includes('username')) {
            message = 'Username already exists';
        } else if (err.message.includes('email')) {
            message = 'Email already exists';
        } else {
            message = 'Duplicate entry';
        }
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        status = 403;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        status = 403;
        message = 'Token expired';
    }

    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
