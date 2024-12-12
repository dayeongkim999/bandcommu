const loginApi = require("../services/login_api");
const bandListApi = require("../services/bandList_api");
const contentListApi = require("../services/contentList_api");
const writePostApi = require("../services/writePost_api");
const commentListApi = require("../services/commentList_api");
const waitForSession = require("../utils/waitForSession");
const {createTempLink, findTempLinkbyBandKey} = require("../models/templinkModel");

const getMain = async (req, res) => {
    try {
        // 세션 준비 대기
        await waitForSession(req);

        if (!req.session.access_token) {
            console.log("Access token is missing in session.");
            throw new Error("Access token is missing. Session is not initialized properly.");
        }

        // 밴드 목록 조회
        const bandList = await bandListApi.getBandListUrl(req.session.access_token);
        console.log("밴드 목록 조회 성공");
        res.render('main', { bandList });
    } catch (error) {
        if (error.response) {
            console.log('Cannot fetch Naver band list: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 실패 시 리다이렉트
    }
};

//통계. 안 쓰임
const getBandPage = async (req, res) => {
    const bandKey = req.params.band_key; // URL에서 band_key 추출
    await bandListApi.getBandListUrl(req.session.access_token)
        .then(bandList => {
            const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
            res.render('banddetail', {bandname: band.name, bandkey: band.band_key});
        })
        .catch(error => {
            if (error.response) {
                console.log('cannot fetch band page : ' + error.response.status);            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            res.redirect('/?resultCd=L');
        });
};


//다이스. 구현 X
const getBandDice = async (req, res)=>{
    const bandKey = req.params.band_key; // URL에서 band_key 추출
    await bandListApi.getBandListUrl(req.session.access_token)
        .then(bandList => {
            const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
            console.log("밴드 다이스 조회 test");
            res.render('banddice', {bandname: band.name, bandkey: band.band_key});
        })
        .catch(error => {
            if (error.response) {
                console.log('cannot fetch band page : ' + error.response.status);            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            res.redirect('/?resultCd=L');
        });
}

module.exports = { getMain, getBandPage, getBandDice };