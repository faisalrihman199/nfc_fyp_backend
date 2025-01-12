const models = require("../models/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/db");
const otpController = require("./otpController");

const authController = {
    register: async (req, res) => {
        const { firstName, lastName, email, password, phone, address, otp } = req.body;

        if (!otpController.verifyOTP(otp, email)) {
            return res.status(500).json({ success: false, message: "OTP not correct" });
        }

        const t = await sequelize.transaction();

        try {
            // Check if the email already exists
            const existingUser = await models.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await models.User.create({ email, password: hashedPassword }, { transaction: t });
            const customer = await models.Customer.create(
                { firstName, lastName, phone, address, userId: user.id },
                { transaction: t }
            );

            await t.commit();
            res.status(201).json({ success: true, message: "Registration successful" });
        } catch (error) {
            console.error("Error registering customer:", error);
            await t.rollback();
            res.status(500).json({ success: false, message: "Error registering customer." });
        }
    },
    getUserInfo: async (req, res) => {
        const user = req.user;
    
        if (user.role === 'admin') {
            return res.status(200).json({ success: true, data: user });
        }
    
        try {
            if (user.role === 'customer') {
                try {
                    // Use the Customer model to fetch customer information
                    let customerInfo = await models.Customer.findOne({ where: { userId: user.id } });
            
                    if (!customerInfo) {
                        return res.status(404).json({ success: false, message: "Customer does not exist" });
                    }
            
                    // Add the user's email to the customer info
                    customerInfo = { ...customerInfo.toJSON(), email: user.email };
            
                    // Send back the updated customer information
                    return res.status(200).json({ success: true, data: customerInfo });
                } catch (error) {
                    console.error("Error fetching customer information:", error);
                    return res.status(500).json({ success: false, message: "Error fetching customer information." });
                }
            }
    
            // If the role is not recognized
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        } catch (error) {
            console.error("Error fetching user information:", error);
            res.status(500).json({ success: false, message: "Error fetching user information." });
        }
    },
    setUserInfo: async (req, res) => {
        const user = req.user;
    
        // If the role is admin, allow changing only email and password in the User table
        if (user.role === 'admin') {
            const { email, password } = req.body;
    
            if (!email ) {
                return res.status(400).json({ success: false, message: "Email or password must be provided" });
            }
            let hashedPassword;
            if(password){
                hashedPassword = await bcrypt.hash(password, 10);
            }

            try {
                const existUser= await models.User.findOne({ where: { email:email } });
                if(existUser && existUser.id !== user.id){
                    return res.status(400).json({ success: false, message: "Email already exists"});
                }

                const updatedUser = await models.User.update(
                    {
                        email, 
                        ...(password && { password: hashedPassword }) // Only add password if it's provided
                    },
                    { where: { id: user.id } }
                );
                if (updatedUser[0] === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
    
                return res.status(200).json({ success: true, message: "User information updated successfully" });
            } catch (error) {
                console.error("Error updating admin user information:", error);
                return res.status(500).json({ success: false, message: "Error updating user information" });
            }
        }
    
        // If the role is customer, allow changing email, password, and additional customer details
        if (user.role === 'customer') {
            const { email, password, firstName, lastName, phone, address } = req.body;
    
            if (!email && !firstName && !lastName && !phone && !address) {
                return res.status(400).json({ success: false, message: "At least one field must be provided" });
            }
            let hashedPassword;
            if(password){
                hashedPassword = await bcrypt.hash(password, 10);
            }

    
            try {
                // Update User table for email and password
                const updatedUser = await models.User.update(
                    {
                        email, 
                        ...(password && { password: hashedPassword }) // Only add password if it's provided
                    },
                    { where: { id: user.id } }
                );
    
                if (updatedUser[0] === 0) {
                    return res.status(404).json({ success: false, message: "User not found" });
                }
    
                // Update Customer table for additional details
                const updatedCustomer = await models.Customer.update(
                    { firstName, lastName, phone, address }, // Update customer details
                    { where: { userId: user.id } }
                );
    
                if (updatedCustomer[0] === 0) {
                    return res.status(404).json({ success: false, message: "Customer details not found" });
                }
    
                return res.status(200).json({ success: true, message: "Customer information updated successfully" });
            } catch (error) {
                console.error("Error updating customer information:", error);
                return res.status(500).json({ success: false, message: "Error updating customer information" });
            }
        }
    
        // If the role is not recognized
        return res.status(403).json({ success: false, message: "Unauthorized access" });
    },
    
    
    

    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await models.User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ success: false, message: "User not found" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Invalid password" });
            }
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, "nfc_project");
            res.status(200).json({
                success: true,
                data: {
                    role: user.role,
                    token
                }
            });
        } catch (error) {
            console.error("Error logging in:", error);
            res.status(500).json({ success: false, message: "Error logging in." });
        }
    },

    verifyOtpForPasswordReset: async (req, res) => {
        const { email, otp, newPassword } = req.body;

        if (!otpController.verifyOTP(otp, email)) {
            return res.status(500).json({ success: false, message: "OTP not correct" });
        }

        try {
            if (!newPassword) {
                return res.status(400).json({ success: false, message: "New password is required" });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await models.User.update({ password: hashedPassword }, { where: { email } });

            res.status(200).json({ success: true, message: "Password reset successfully" });
        } catch (error) {
            console.error("Error resetting password:", error);
            res.status(500).json({ success: false, message: "Error resetting password." });
        }
    },

    changePassword: async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!userId) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        try {
            const user = await models.User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordMatch) {
                return res.status(200).json({ success: false, message: "Current password is incorrect" });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            await user.save();

            res.status(200).json({ success: true, message: "Password updated successfully" });
        } catch (error) {
            console.error("Error updating password:", error);
            res.status(500).json({ success: false, message: "Error updating password" });
        }
    }
};

module.exports = authController;
