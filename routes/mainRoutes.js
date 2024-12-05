const router = require('express').Router();
const cookieParser = require("cookie-parser");
const checkLogin = require('../middlewares/checkLogin');

router.use(cookieParser());

const {
    getMain,
    getBandPage,
    getBandPairGame,
    getBandDice
} = require("../controllers/mainController")

router.route("/").get(checkLogin, getMain);
router.route("/:band_key").get(checkLogin, getBandPage);
router.route("/:band_key/pairgame").get(checkLogin, getBandPairGame);
router.route("/:band_key/pairgame/continue").post();
router.route("/:band_key/dice").get(checkLogin, getBandDice);

module.exports = router;