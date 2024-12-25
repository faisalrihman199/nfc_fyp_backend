var express = require('express');
var router = express.Router();
var admin = require("./admin")
var auth = require("./auth")
var otp = require("./otp")
var customer = require("./customer")
var tags = require("./tags")


router.get('/', function(req, res, next) {
  res.send("NFC Project is running")
});
router.use("/admin",admin)
router.use("/auth",auth)
router.use("/otp",otp)
router.use("/tags",tags)
router.use("/customer",customer)

module.exports = router;
