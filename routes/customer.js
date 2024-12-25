var express = require('express');
var router = express.Router();
var controllers = require("../controllers/index")
const authenticateToken = require('../middleware/authMiddleware');

router.put('/update',authenticateToken, controllers.customer.changeProfile);
router.get('/profile',authenticateToken, controllers.customer.getUserProfile);

module.exports = router;
