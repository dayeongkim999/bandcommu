const router = require('express').Router();
const getToken = require('../middlewares/getToken');

const {
    getMain,
} = require("../controllers/mainController")

router.route("/").get(getMain);

module.exports = router;