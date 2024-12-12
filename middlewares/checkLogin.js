const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;

const checkLogin = async (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const token = req.cookies.token;
    if(!token){
        return res.redirect("/");
    }

    try{
        const decoded = jwt.verify(token, jwtSecret);
        // manager가 true인지 확인
        if (decoded.manager !== true) {
            // manager가 아니라면 특정 URL로 리다이렉트
            return res.redirect("/?resultCd=L");
        }
        req.username = decoded.username;
        next();
    } catch(error){
        return res.status(401).json({ message: "로그인이 필요합니다."});
    }
}

module.exports = checkLogin;