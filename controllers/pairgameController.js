const { TempLink, createTempLink, handleTempLink, findTempLinkbyBandKey } = require("../models/templinkModel");
const {
    PairStatus,
    getPairsInEarlyOrder,
    makeFinalPairs } = require('../models/pairstatusModel');
const bandListApi = require("../services/bandList_api");
const contentListApi = require("../services/contentList_api");
require('dotenv').config();
const baseUrl = process.env.BASE_URL

//페어게임
const getBandPairGame = async (req, res) => {
    try {
        const bandKey = req.params.band_key; // URL에서 band_key 추출
        //만약 해당 band에서 이미 페어게임 링크를 발부했다면(DB check)
        //현재 진행상황 링크로 이동
        const existingNoticeId = await findTempLinkbyBandKey(bandKey);
        if (existingNoticeId) {
            // 이미 존재하면 해당 링크로 리다이렉트
            return res.redirect(`/main/${bandKey}/pairgame/${existingNoticeId.notice_id}`);
        }

        //안 했다면
        // 밴드 목록 가져오기
        const bandList = await bandListApi.getBandListUrl(req.session.access_token);
        const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
        req.session.band_cover = band.cover;
        req.session.band_name = band.name;

        if (!band) {
            console.log('Band not found');
            return res.redirect('/?resultCd=L'); // 밴드가 없으면 리다이렉트
        }

        console.log("밴드 페어게임 조회 test");

        // 공지 목록 가져오기
        // 만약 페어게임 신청을 진행했던 글이 있다면 최상단에 표시, 누르면 글 작성 화면으로 이동

        // 공지 목록 불러오기
        const day = 6;
        const noticeList = await contentListApi.getNoticeList(req.session.access_token, bandKey, day);

        //공지가 없다면
        if (noticeList.length === 0) {
            noticeList.push({
                author: { name: "서비스 관리자" },
                content: "앗!" + day + "일 이내 #공지 글이 없어요!",
                created_at: Date.now(),
            });
        }

        // 렌더링
        res.render('bandpairgame', {
            bandname: band.name,
            bandkey: band.band_key,
            noticeList: noticeList // 글 목록 전달
        });
    } catch (error) {
        if (error.response) {
            console.log('Error fetching data: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트
    }
}
//페어게임 신청 현황 화면
const getBandPairGameNow = async (req, res) => {
    try {
        const bandKey = req.params.band_key; // URL에서 band_key 추출
        const postKey = req.params.post_key; // URL에서 post_key 추출
        const bandCover = req.session.band_cover; //세션에서 밴드 커버 추출
        const bandName = req.session.band_name;

        // 참여자들이 사용할 url이 존재하는지 bandKey로 확인
        // 없을 시 생성
        let existingURL = await findTempLinkbyBandKey(bandKey);
        if (!existingURL) {
            // 존재하지 않으면 링크 생성
            const noticeId = postKey
            //개발 테스트용
            const now = new Date(); // 현재 시간
            now.setMinutes(now.getMinutes() + 5); // 현재 시간에 5분 추가
            const access_hour = now.getHours(), access_minute = now.getMinutes();
            now.setMinutes(now.getMinutes() + 5); // 현재 시간에 5분 추가
            const expired_hour = now.getHours(), expired_minute = now.getMinutes();
            existingURL = await createTempLink(noticeId, bandKey, bandCover, bandName, expired_hour, expired_minute, access_hour, access_minute);
        }

        const bandList = await bandListApi.getBandListUrl(req.session.access_token);
        const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
        const link = await handleTempLink(existingURL.token);

        req.session.post_key = req.params.post_key;
        req.session.band_key = req.params.band_key;

        // 있을 시
        // 렌더링
        res.render('bandpairgamenow', { bandKey, postKey, bandname: band.name, expires_at: existingURL.expires_at, link, baseUrl });
    } catch (error) {
        if (error.response) {
            console.log('Error fetching notice data: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 에러 시 리다이렉트
    }
}

// DB에서 특정 post_key의 페어게임 현황 가져오기
async function getPairStatus(postKey) {
    const status = await PairStatus.find({ post_key: postKey });
    console.log(status);
    return status.map(item => ({
        user: item.user_name,
        opponent: item.opponent_name,
        timestamp: item.updated_at,
    }));
}


// 찌름 마감 시간 반환
async function getDeadline(req, res) {
    try {
        const band_key = req.session.band_key;
        const tempLink = await findTempLinkbyBandKey(band_key);
        if (tempLink) {
            res.json({ access_restricted_at: tempLink.access_restricted_at });
        } else {
            res.status(404).json({ error: 'No deadline found' });
        }
    } catch (error) {
        console.error('Error fetching deadline:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//페어 게임 데이터 반환하기
async function getPairgameData(req, res) {
    try {
        const postKey = req.params.post_key; // URL에서 post_key 추출
        const pairs = await getPairsInEarlyOrder(postKey); // 예: 가장 최근 마감 링크 가져오기
        if (pairs) {
            res.json(pairs);
        } else {
            res.status(404).json({ error: 'No pairgame found' });
        }
    } catch (error) {
        console.error('Error fetching pair game data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getPairgameCompleteLink(req, res) {
    try {
        //해당 공지 글의 찌름 마감 시간이 지났나 확인
        const bandKey = req.session.band_key;
        const postKey = req.session.post_key;
        const link = await findTempLinkbyBandKey(bandKey);
        const access_restricted_at = link.access_restricted_at;
        const now = new Date();
        //지났다면 링크 반환
        if (access_restricted_at <= now) {
            res.json({
                status: 'success',
                message: '결과를 확인합니다.',
                result: `${baseUrl}/main/${bandKey}/pairgame/${postKey}/complete` // 완료 페이지 링크
            });
        } else {
            //안 지났다면 본래 링크 반환
            res.json({
                status: 'failed',
                message: '찌름 마감 기한이 지나지 않아 접근 불가능합니다.',
                result: ''
            });
        }
    }
    catch (error) {
        console.error('Error fetching pair game complete link:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function getBandPairGameComplete(req, res){
    try{
        //글 작성
        const band_key = req.params.band_key;
        const post_key = req.params.post_key;
        const bandname = req.session.band_name;
        const access_token = req.session.access_token;
        const content = await writingPair(access_token, band_key, post_key);
        const formattedContent = content.replace(/\n/g, '<br>');
        //화면에 보여줌
        res.render('bandpairgameresult', {formattedContent, bandKey: band_key, postKey: post_key, bandname, baseUrl});
    } catch(error){
        console.error('Error get pair game complete:', error);
    }
}

// 초고 작성 함수
async function writingPair(access_token, band_key, post_key) {
    try {
        //랜덤 페어 만들기
        const matched = await makeFinalPairs(access_token, band_key, post_key);
        console.log(`matched pair ${matched}`);

        //글 작성
        // 페어를 문자열로 변환
        const formattedPairs = matched.map(pair => {
            const userKeys = pair.map(p => `@${p.author.name}`).join(" - ");
            return userKeys;
        });

        // 글 작성 (formattedPairs를 활용)
        const postContent = formattedPairs.join("\n");
        console.log("Post content:\n", postContent);

        return postContent;
    } catch (error) {
        console.error("Error in writingPair:", error);
    }
}


module.exports = { getBandPairGame, getBandPairGameNow, getPairStatus, getDeadline, getPairgameData, writingPair, getPairgameCompleteLink, getBandPairGameComplete }