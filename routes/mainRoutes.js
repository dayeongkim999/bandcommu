const router = require('express').Router();
const cookieParser = require("cookie-parser");
const checkLogin = require('../middlewares/checkLogin');

router.use(cookieParser());

const {
    getMain,
} = require("../controllers/mainController")

router.route("/").get(checkLogin, getMain);

module.exports = router;