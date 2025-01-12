var express = require('express');
var router = express.Router();
var controllers = require("../controllers/index");
const authenticateToken = require('../middleware/authMiddleware');

router.post('/login', controllers.auth.login);
router.get('/userInfo',authenticateToken, controllers.auth.getUserInfo);
router.post('/updateUser',authenticateToken, controllers.auth.setUserInfo);
router.post('/register', controllers.auth.register);
router.post('/forgotPassword', controllers.auth.verifyOtpForPasswordReset);
router.patch('/changePassword', authenticateToken,controllers.auth.changePassword);

module.exports = router