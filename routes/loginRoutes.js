const router = require('express').Router();

const {
    getLogin,
    authUser,
    getRegister,
    registerUser,
    deleteUser
} = require("../controllers/loginController")

router.route("/callback").get(getLogin);
router.route("/auth").post(authUser);

router.route("/register")
    .get(getRegister)
    .post(registerUser);
router.route("/users/:id").delete(deleteUser);

module.exports = router;