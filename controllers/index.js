const auth = require("./authController")
const otp = require("./otpController")
const admin = require("./adminController")
const customer = require("./customerController")
const tag = require("./tagController")
const controllers = {admin,auth,otp,customer,tag}

module.exports = controllers
