const {TempLink, createTempLink, handleTempLink, findTempLinkbyBandKey} = require("../models/templinkModel");
const {
    PairStatus,
    createPair,
    getPairsInEarlyOrder,
    getPairsExcludedSelfPair, 
    findSelfPair} = require('../models/pairstatusModel');
const bandListApi = require("../services/bandList_api");
const contentListApi = require("../services/contentList_api");
const { getAllParticipants } = require("../services/commentList_api");


//페어게임
const getBandPairGame = async (req, res)=>{
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
        const day = 4;
        const noticeList = await contentListApi.getNoticeList(req.session.access_token, bandKey, day);
        
        //공지가 없다면
        if (noticeList.length === 0) {
            noticeList.push({
                author: { name: "서비스 관리자" },
                content: "앗!" +day+"일 이내 #공지 글이 없어요!",
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
const getBandPairGameNow = async (req, res)=>{
    try{
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
            existingURL = await createTempLink(noticeId, bandKey, bandCover, bandName);
        }

        const bandList = await bandListApi.getBandListUrl(req.session.access_token);
        const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
        const link = await handleTempLink(existingURL.token);

        // 있을 시
        // 렌더링
        res.render('bandpairgamenow', {bandKey, postKey, bandname: band.name, expires_at: existingURL.expires_at, link});
    } catch(error){
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


// 마감 시간 반환
async function getDeadline(req, res) {
    try {
        const tempLink = await TempLink.findOne(); // 예: 가장 최근 마감 링크 가져오기
        if (tempLink) {
            res.json({ expires_at: tempLink.expires_at });
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


// 삭제된 문서 처리 함수
async function matchingPair(band_key, post_key) {
    try{
        //페어 매칭 저장
        let matches = [];

        //자찌름 페어
        const selfPairs = await findSelfPair(post_key);
        for (const pair of selfPairs) {
            // pair는 MongoDB에서 조회한 문서 객체
            // 문서 안의 user_name 필드에 접근 가능
            matches.push([pair.user_name, pair.user_name]);
        }        

        //자찌름 페어 제외 목록
        let pairExcludedSelf = await getPairsExcludedSelfPair(post_key);

        //맞찌름 처리

        
        //선찌름 처리
        //나머지 랜덤 처리
        //매칭된 페어 목록 반환
    } catch(error){

    }
}


module.exports = {getBandPairGame, getBandPairGameNow, getPairStatus, getDeadline, getPairgameData, matchingPair }