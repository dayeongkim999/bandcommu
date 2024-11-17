const router = require('express').Router();

const {
    getLogin,
} = require("../controllers/loginController")

router.route("/callback").get(getLogin);

module.exports = router;