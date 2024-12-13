const axios = require("axios");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const loginApi = require('../services/login_api');
const bandListApi = require("../services/bandList_api");
const {
    Authcode,
    verifyAuthcode,
    findUserByNickname,
    findUserByUserkey,
    updateUserByNickname,
    updateAccessTime
} = require("../models/authcodeModel");
const bcrypt = require("bcryptjs");

const getLogin = async (req, res) => {
    try {
        //band API 로그인
        const code = req.query.code;

        const bandAccessTokenUrl = loginApi.ACCESSTOKEN_URL + '&code=' + code;
        const base64Encoded = loginApi.getBase64Encoded();
        const options = {
            url: bandAccessTokenUrl,
            headers: { Authorization: 'Basic ' + base64Encoded }
        };

        const { data } = await axios(options);

        req.session.access_token = data.access_token;
        const user_key = data.user_key;
        const nickname = req.session.nickname;

        //밴드 로그인 성공 시
        //접속 경로 구분
        const external = req.session.external;
        console.log(external);
        //유저임(external이 true)        
        if (external === true) {
            res.redirect('/external/pairformlink');
        }
        else if (external === false) {
            //관리진임
            //최초접속 확인: 인증을 했던 사용자는 user_key 소유 
            const user = await findUserByUserkey(user_key);
            if (!user) {//인증 안 된 최초 접속자라면
                //authCode 사용 처리 및 user key 업데이트
                const isUpdate = await updateUserByNickname(nickname, user_key);
                if (!isUpdate) return res.redirect('/?resultCd=L');
            }

            //최초 접속자가 아니면 기존 user_key와 현재 user_key 비교
            if (!(user_key === user.user_key)) {
                return res.redirect('/?resultCd=L');
            }

            //access token 발급
            const token = jwt.sign({ manager: true, id: user._id }, jwtSecret, { expiresIn: '1d' });
            res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

            //발급 시간 연월로 변경
            let now = new Date();
            let accessTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            //token 발급 시간 db에 업뎃
            updateAccessTime(user, accessTime);

            //메인으로
            res.redirect('/main');
        }
        else{
            console.log("external error");
            return res.redirect('/?resultCd=L');
        } 

    } catch (error) {
        if (error.response) {
            console.log('naver band access token get response error : ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }

        // 오류 발생 시 리다이렉트
        res.redirect('/?resultCd=L');
    }
};


const authUser = async (req, res) => {
    try {
        //인증코드 받기
        const nickname = req.body.nickname;
        const authCode = req.body.authCode;

        // 세션에 nickname 저장
        req.session.nickname = nickname;

        //DB에 이름 존재하나 비교
        const user = await findUserByNickname(nickname);
        //존재하지 않는다면 리다이렉트
        if (!user) {
            return res.status(200).json({
                success: false,
                redirectUrl: '/?resultCd=L',
            });
        }
        //존재한다면 관리진으로 저장
        req.session.external = false;
        await req.session.save();
        //인증한 적 있는지 확인
        //인증 한 적이 있다면
        if (user.isVerified) {
            let bandLoginUrl = await loginApi.getLoginUrl();
            res.json({ success: true, redirectUrl: bandLoginUrl }); // Band 로그인 URL 반환
        }
        //인증 한 적이 없다면
        else {
            //인증 코드 비교
            const check = await verifyAuthcode(authCode, user.hashCode);

            //인증 코드가 맞다면
            if (check) {
                let bandLoginUrl = await loginApi.getLoginUrl();
                res.json({ success: true, redirectUrl: bandLoginUrl }); // Band 로그인 URL 반환
            }
            else {
                //인증코드가 틀렸다면 오류 페이지로 리다이렉트
                res.json({ success: false, redirectUrl: '/?resultCd=L', message: 'Invalid auth code' }); // 오류 메시지 반환
            }
        }
    } catch (error) {
        if (error.response) {
            console.log('authentication error : ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);

        // 오류 발생 시 리다이렉트
        res.redirect('/?resultCd=L');
    }
}


const getRegister = async (req, res) => {
    try {
        // 유저 목록 불러오기
        const userList = await Authcode.find({}); // 특정 필드만 가져옴
        // EJS 템플릿에 데이터 전달
        res.render("register", { users: userList });
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류");
    }
}

const registerUser = async (req, res) => {
    try {
        // 데이터 받기
        const { nickname } = req.body;

        // 랜덤으로 인증 코드 생성
        const authentication = Math.floor(100000 + Math.random() * 900000).toString();

        // 인증 코드 해싱
        const hashedcode = await bcrypt.hash(authentication, 10);

        // DB에 등록
        const user = await Authcode.create({
            nickname: nickname,
            hashCode: hashedcode,
            isVerified: false,
        });

        const _id = user._id.toString();

        // 인증 코드는 팝업으로 보여주고 다시 뜨지 않음
        // 인증 코드와 성공 상태를 JSON으로 반환
        res.status(200).json({
            success: true,
            message: "User registered successfully",
            authentication,
            _id,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("유저 등록 중 오류가 발생했습니다.");
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await Authcode.findByIdAndDelete(userId); // MongoDB에서 해당 유저 삭제

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            id: userId,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("삭제 중 오류 발생");
    }
}

module.exports = { getLogin, authUser, getRegister, registerUser, deleteUser }