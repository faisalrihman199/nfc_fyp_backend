const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const sequelize = require("../config/db");

function generateOTP(email) {
    const otp = speakeasy.totp({
        secret: email,  
        encoding: 'base32'
    });
    console.log(otp);
    return otp;
}

function verifyOTP(token, email) {
    const verified = speakeasy.totp.verify({
        secret: email,
        encoding: 'base32',
        token: token,
        window: 1
    });
    return verified;
}

async function sendOTPEmail(email) {
    
    const otp = generateOTP(email);
    let transporter = nodemailer.createTransport({
        service: 'gmail',  // Adjust this according to your email service
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    let info = await transporter.sendMail({
        from: '"NFC OTP" <your-email@gmail.com>',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`
    });

    console.log('Message sent: %s', info.messageId);
}

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        await sendOTPEmail(email);
        res.status(200).send({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

exports.generateOTP = generateOTP;
exports.verifyOTP = verifyOTP;
exports.sendOTPEmail = sendOTPEmail;
