const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;

const checkBand = async (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/?resultCd=L");
    }
    //토큰 안의 member=true 확인 후 토큰 안의 band_key와 params의 band_key가 일치하나 확인
    //성공시 넘어감
    //실패시 해당 밴드의 멤버가 아닙니다. 하고 거절
    try {
        //토큰 검증 및 디코딩
        const decoded = jwt.verify(token, jwtSecret);

        // member 값 확인
        if (!decoded.member) {
            return res.status(403).json({ message: "해당 밴드의 멤버가 아닙니다." });
        }

        // band_key 값 비교
        if (decoded.band !== req.params.band_key) {
            console.log(decoded);
            console.log(decoded.band_key);
            console.log(req.params.band_key);
            return res.status(403).json({ message: "밴드 키가 일치하지 않습니다." });
        }

        // 인증 성공: 사용자 정보 설정 및 다음으로 이동
        req.username = decoded.username;

        next();
    } catch (error) {
        return res.status(401).json({ message: "해당 밴드의 멤버가 아닙니다." });
    }
}

module.exports = checkBand;