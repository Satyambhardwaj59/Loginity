import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodeMailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if(!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({name, email, password: hashedPassword});

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000
        // });
        res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",  // ✅ must be true on Render
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ required
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

        // Sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Our App!',
            text: `Welcome to our website. your account has been created successfully with email id: ${email}.`
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: "User created succesfully!!"});

        
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
} 

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'Email and password are required'})
    }

    try {

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "Invalid email"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.json({success: false, message: "Invalid password"});
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000
        // });
        res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",  // ✅ must be true on Render
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ✅ required
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

        return res.json({success: true, message: "Login succesfully!!"});
        
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const logout = async (req, res) => {
    try {

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({success: true, message: "Logout successful!!"});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}


// send Verification OTP to the user's Email
export const sendVerifyOtp = async (req, res) => {
    try {

        const {userId} = req;

        const user = await userModel.findById(userId);
        if(!user) {
            return res.json({success: false, message: "User not found"});
        }

        if(user.isAccountVerified) {
            return res.json({success: false, message: "Account already verified"});
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        const mailOption = {
             from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Verify Your Email',
            // text: `Your verification OTP is: ${otp}. It is valid for 24 hours.`,
            html: EMAIL_VERIFY_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', user.email)
        }

        await transporter.sendMail(mailOption);

        return res.json({success: true, message: "OTP sent to your email"});

    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

export const verifyEmail = async (req, res) => {
    const {userId} = req;
    const {otp} = req.body;

    if(!userId || !otp) {
        return res.json({success: false, message: "All fields are required"});
    }

    try {

        const user = await userModel.findById(userId);
        if(!user) {
            return res.json({success: false, message: "User not found"});
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.json({success: false, message: 'Invalid OTP'});
        }

        if(user.verifyOtpExpireAt < Date.now()){
            return res.json({success: flase, message: 'OTP Expire'});
        } 

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: 'Email verified successfully'});
        
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}


// Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        
        return res.json({success: true, message: "User is authenticated"});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Send Password reset OTP 

export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.json({success: false, message: "Email is required"});
    }

    try {

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 min

        await user.save();

        const mailOption = {
             from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `Your OTP for reseting your password is: ${otp}. Use this otp to proceed with resetting your password. It is valid for 15 min.`
            html: PASSWORD_RESET_TEMPLATE.replace('{{otp}}', otp).replace('{{email}}', user.email)
        }

        await transporter.sendMail(mailOption);

        return res.json({success: true, message: "OTP send to your email"})

        
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

// Reset User Password 

export const resetPassword = async (req, res)=> {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({success: false, message: "Email, OTP, new Password are required !!"});
    }

    try {

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"});
        }

        if(user.resetOtp === '' || user.resetOtp !== otp){
            return res.json({success: false, message: "Invalid OTP !!!"});
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP Expired"});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({success: true, message: "Password has been reset successfully!!"});
        
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}