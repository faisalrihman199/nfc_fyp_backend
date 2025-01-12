var express = require('express');
var router = express.Router();
var controllers = require("../controllers/index");
const authenticateToken = require('../middleware/authMiddleware');

router.post('/add',authenticateToken,controllers.tag.addTag);
router.get('/all',authenticateToken, controllers.tag.getTagsByQuery);
router.post('/update',authenticateToken, controllers.tag.updateTag);

module.exports = router