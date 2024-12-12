const router = require('express').Router();
require('dotenv').config({path: '../conf/.env'});
const checkBand= require('../middlewares/checkBand');
const {
    getExternalPairform,
    getExternalPairgame,
    getExternalPairformLink,
    postExternalPairform,
    getExternalExpired
} = require("../controllers/externalformController")


//메인 화면
router.route("/pairgame/:notice_id/:band_key").get(getExternalPairgame);
router.route("/pairformlink").get(getExternalPairformLink);
router.route("/pairform/:notice_id/:band_key")
    .get(checkBand, getExternalPairform)
    .post(checkBand, postExternalPairform);
router.route("/expired").get(getExternalExpired);

module.exports = router;