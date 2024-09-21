const nodemailer = require('nodemailer');

const sendEmail = options => {

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,// techonolgy using to send the email
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        }
    });

    
    const mailOptions = {
        from: 'namdevdisha2502@gmail.com',
        to: options.email,
        text: options.message,
        subject: options.subject,
    };

 transporter.sendMail(mailOptions);
}

// this sendEmail won't be a async operation.

module.exports = sendEmail;