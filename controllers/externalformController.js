const { findTempLinkbyBandKey } = require("../models/templinkModel");
const loginApi = require('../services/login_api');
const profileApi = require('../services/profile_api');
const commentListApi = require('../services/commentList_api');
const {
    createPair,
    findPair,
    updatePair} = require('../models/pairstatusModel');
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

//외부자 메인
const getExternalPairgame = async (req, res) => {
    try {
        const band_key = req.params.band_key;
        const existlink = await findTempLinkbyBandKey(band_key);
        if (!existlink) { //페이지 만료 or 존재하지 않을 시 이동
            console.log('expired link');
            return res.render('externalexpired');
        }

        //만료되지 않은 링크라면
        //세션에 external, band_key, notice_id 저장
        req.session.external = true;
        req.session.band_key = band_key;
        req.session.notice_id = req.params.notice_id;
        if (!req.params.band_key || !req.params.notice_id) {
            console.log('Invalid parameters');
            return res.render('error', { message: 'Invalid or missing parameters.' });
        }

        //밴드 커버
        const band = await findTempLinkbyBandKey(band_key);
        const band_cover = band.band_cover;
        const band_name = band.band_name;
        //로그인
        let bandLoginUrl = await loginApi.getLoginUrl();
        res.render('externalpairgame', {bandLoginUrl, band_cover, band_name});
    }
    catch (error) {
        if (error.response) {
            console.log('Error fetching external pair game: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트        
    }
}

//링크 연결
const getExternalPairformLink = async (req, res) => {
    try {
        //주어진 링크를 타고 온 외부인인지 확인
        const external = req.session.external;
        if (!external) {
            console.log('Not Valid User');
            return res.redirect('/?resultCd=L');
        }

        //정식 링크를 타고 온 외부인이 맞다면
        const band_key = req.session.band_key;
        const notice_id = req.session.notice_id;

        if (!band_key || !notice_id) {
            console.log('Missing required session data');
            return res.redirect('/?resultCd=L');
        }

        //현재 밴드에 가입되어 있는지 확인
        //기본 프로필 불러오기
        // const profile = await profileApi.getProfileUrl(req.session.access_token);
        // console.log(profile);
        // if (!profile) {
        //     console.log('Cannot fetch normal band profile');
        //     return res.redirect('/?resultCd=L');
        // }
        //특정 밴드 프로필 불러오기
        const bandprofile = await profileApi.getBandProfileUrl(req.session.access_token, band_key);
        console.log(bandprofile);
        if (!bandprofile) {
            //가입자가 아님
            console.log('Not band member');
            return res.redirect('/?resultCd=L');
        }
        //밴드의 멤버임을 인증하는 토큰 발급
        const token = jwt.sign({ member: true, band: band_key }, jwtSecret, { expiresIn: '1d' });
        res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        //유저 캐릭터 이름, 유저 키 세션에 저장
        req.session.character = bandprofile.member_name;
        req.session.user_key = bandprofile.user_key;

        //연결
        const link = `/external/pairform/${notice_id}/${band_key}`;
        res.redirect(link);

    } catch (error) {
        if (error.response) {
            console.log('Error at pair form link: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트
    }
}

//신청 페이지 불러오기
const getExternalPairform = async (req, res) => {
    try {
        //현재 접속자 이름
        const character = req.session.character;
        const bandname = req.session.band_name;
        //현재 게임 참여자 목록 불러오기
        const access_token = req.session.access_token;
        const band_key = req.session.band_key;
        const notice_id = req.session.notice_id;

        if (!character || !access_token || !band_key || !notice_id) {
            console.error('Missing session data:', { character, access_token, band_key, notice_id });
            return res.redirect('/?resultCd=L'); // 세션 데이터 누락 시 리다이렉트
        }

        const commentList = await commentListApi.getAllParticipants(access_token, band_key, notice_id);

        res.render('externalpairform', {character, commentList, bandname, band_key, notice_id});
    } catch (error) {
        if (error.response) {
            console.log('Error at pair form get: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트
    }
}

//찌름 완료
const postExternalPairform = async (req, res) => {
    try{
        const bandname = req.session.band_name;

        //받은 데이터
        const opponent_name = req.body.opponent_name; // 배열로 전송된 participants
        const opponent_key = req.body.opponent_key; // 선택된 캐릭터
        const band_key = req.session.band_key;
        const post_key = req.session.notice_id;
        const user_name = req.session.character;
        const user_key = req.session.user_key;

        //이미 저장되어 있는지 확인
        const checkPair = await findPair(user_key);
        let pair;
        if(checkPair && checkPair.length > 0){
        //만약 되어있다면 update
            pair = await updatePair(band_key, post_key, user_name, user_key, opponent_name, opponent_key);
        }
        else{
        //저장되어 있지 않다면
        //pairstatus 모델에 저장
            pair = await createPair(band_key, post_key, user_name, user_key, opponent_name, opponent_key);
        }
        //화면에 표시
        res.render('externalpairformcomplete', {bandname, pair});

    } catch (error){
        if (error.response) {
            console.log('Error at pair form post: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트
    }
}

module.exports = { getExternalPairform, getExternalPairgame, getExternalPairformLink, postExternalPairform };