const router = require('express').Router();
require('dotenv').config({path: '../conf/.env'});
const {
    getIndexPage,
} = require("../controllers/indexController")


//메인 화면
router.route("/").get(getIndexPage);

module.exports = router;