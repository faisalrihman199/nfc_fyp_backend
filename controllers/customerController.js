const models = require("../models/index");
const sequelize = require("../config/db");
const bcrypt = require("bcrypt");

const customerController = {
    changeProfile: async (req, res) => {
        const { firstName, lastName, email, password, address, phone } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const t = await sequelize.transaction();

        try {
            const updatedUserFields = { email };
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                updatedUserFields.password = hashedPassword;
            }

            await models.User.update(updatedUserFields, { where: { id: user.id }, transaction: t });
            await models.Customer.update(
                { firstName, lastName, address, phone },
                { where: { userId: user.id }, transaction: t }
            );

            await t.commit();
            res.status(200).json({ success: true, message: "Profile updated successfully" });
        } catch (error) {
            console.error("Error updating profile:", error);
            await t.rollback();
            res.status(500).json({ success: false, message: "Error updating profile" });
        }
    },

    getUserProfile: async (req, res) => {
        const user = req.user;

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        try {
            const customer = await models.Customer.findOne({
                where: { userId: user.id },
                attributes: ["firstName", "lastName", "address", "phone", "status"],
            });

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: "Customer profile not found",
                });
            }

            const responseData = {
                email: user.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                address: customer.address,
                phone: customer.phone,
                status: customer.status,
                role: user.role,
            };

            res.status(200).json({
                success: true,
                message: "User profile fetched successfully",
                data: responseData,
            });
        } catch (error) {
            console.error("Error fetching user profile:", error);
            res.status(500).json({ success: false, message: "Error fetching user profile" });
        }
    },
};

module.exports = customerController;
