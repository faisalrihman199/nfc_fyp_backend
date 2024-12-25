const models = require("../models/index");
const sequelize = require("../config/db");
const { where } = require("sequelize");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
require('dotenv').config();

// Ensure the encryption key exists and is of correct format
const algorithm = 'aes-256-cbc';
let secretKey;

if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in the environment variables');
} else {
    secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (secretKey.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes long for AES-256-CBC');
    }
}

const ivLength = 16; // AES block size is 16 bytes

// Add a new tag with default status as 'pending'
exports.addTag = async (req, res) => {
    const { user } = req;
    if (user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Permissions not allowed' });
    }
    const { uid, tagType, information } = req.body;

    const t = await sequelize.transaction();
    try {
        const newTag = await models.Tag.create(
            {
                uid,
                tagType,
                information,
                status: 'pending' // Default status
            },
            { transaction: t }
        );

        await t.commit();
        res.status(201).json({ success: true, message: 'Tag added successfully', data: newTag });
    } catch (error) {
        console.error('Error adding tag:', error);
        await t.rollback();
        res.status(500).json({ success: false, message: 'Error adding tag' });
    }
};

// Get tags by status and type (with pagination)
exports.getTagsByQuery = async (req, res) => {
    const { user } = req;
    const { status, tagType, page = 1, pageSize = 10 } = req.query;  // Pagination and filter parameters
    const offset = (page - 1) * pageSize;

    try {
        let whereClause = { status };

        // If the user is not an admin, filter by customerId
        if (user.role !== 'admin') {
            const customer = await models.Customer.findOne({ where: { userId: user.id } });
            if (customer) {
                whereClause.customerId = customer.id;
            }
        }

        // If a tagType is provided, include that in the filter
        if (tagType) {
            whereClause.tagType = tagType;
        }

        const tags = await models.Tag.findAndCountAll({
            where: whereClause,
            limit: pageSize,
            offset: offset,
        });

        res.status(200).json({
            success: true,
            data: tags.rows,
            totalCount: tags.count,
            totalPages: Math.ceil(tags.count / pageSize),
            currentPage: page,
        });
    } catch (error) {
        console.error('Error fetching tags by status:', error);
        res.status(500).json({ success: false, message: 'Error fetching tags' });
    }
};

// Get current customer tags
exports.getCustomerTags = async (req, res) => {
    const { user } = req;

    try {
        const customer = await models.Customer.findOne({
            where: { userId: user.id },
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const customerTags = await models.Tag.findAll({
            where: { customerId: customer.id },
        });

        res.status(200).json({ success: true, data: customerTags });
    } catch (error) {
        console.error('Error fetching customer tags:', error);
        res.status(500).json({ success: false, message: 'Error fetching customer tags' });
    }
};

// Change tag info
exports.changeTagInfo = async (req, res) => {
    const { user } = req;
    const { tagNumber, information } = req.body;
    const t = await sequelize.transaction();

    try {
        const tag = await models.Tag.findOne({ where: { tagNumber } });

        if (!tag) {
            return res.status(404).json({ success: false, message: 'Tag not found' });
        }

        // Encrypt the new information
        let encryptedInformation = encrypt(information);

        await tag.update(
            { information: encryptedInformation },
            { transaction: t }
        );

        await t.commit();
        res.status(200).json({ success: true, message: 'Tag information updated successfully', data: tag });
    } catch (error) {
        await t.rollback();
        console.error('Error changing tag info:', error);
        res.status(500).json({ success: false, message: 'Error changing tag info' });
    }
};

// Change tag status (admin only)
exports.changeTagStatus = async (req, res) => {
    const { user } = req;
    const { tagNumber, status } = req.body;

    if (user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Permissions not allowed' });
    }

    const t = await sequelize.transaction();

    try {
        const tag = await models.Tag.findOne({ where: { tagNumber } });

        if (!tag) {
            return res.status(404).json({ success: false, message: 'Tag not found' });
        }

        await tag.update(
            { status },
            { transaction: t }
        );

        await t.commit();
        res.status(200).json({ success: true, message: 'Tag status updated successfully', data: tag });
    } catch (error) {
        await t.rollback();
        console.error('Error changing tag status:', error);
        res.status(500).json({ success: false, message: 'Error changing tag status' });
    }
};

function encrypt(text) {
    const iv = crypto.randomBytes(ivLength); // Generate a new IV each time
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex'); // Extract the IV
    const encryptedText = Buffer.from(parts.join(':'), 'hex'); // Combine remaining parts as encrypted text

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString(); // Return the decrypted text
}
