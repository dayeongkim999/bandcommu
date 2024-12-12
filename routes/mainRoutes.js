const router = require('express').Router();
const cookieParser = require("cookie-parser");
const checkLogin = require('../middlewares/checkLogin');

router.use(cookieParser());

const {
    getMain,
    getBandPage,
    getBandDice,
} = require("../controllers/mainController")
const {
     getBandPairGame,
     getBandPairGameNow,
     getBandPairGameComplete
} = require("../controllers/pairgameController");

router.route("/").get(checkLogin, getMain);
//router.route("/:band_key").get(checkLogin, getBandPage); //통계기능 제거로 삭제
router.route("/:band_key").get(checkLogin, getBandPairGame);
router.route("/:band_key/pairgame").get(checkLogin, getBandPairGame);
router.route("/:band_key/pairgame/:post_key").get(checkLogin, getBandPairGameNow);
router.route("/:band_key/pairgame/:post_key/complete").get(checkLogin, getBandPairGameComplete);
//router.route("/:band_key/dice").get(checkLogin, getBandDice); //다이스기능 제거로 삭제

module.exports = router;