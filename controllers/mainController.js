const loginApi = require("../services/login_api");
const bandListApi = require("../services/bandList_api");
const contentListApi = require("../services/contentList_api");

const getMain = async (req, res) => {
    //밴드 목록 조회
    await bandListApi.getBandListUrl(req.session.access_token)
        .then(bandList => {
            console.log("밴드 목록 조회 test");
            res.render('main', { bandList: bandList });
        })
        .catch(error => {
            if (error.response) {
                console.log('cannot fetch Naver band list : ' + error.response.status);
            } else {
                console.log('Error:', error.message);
            }
            console.error(error);
            res.redirect('/?resultCd=L');
        });
}

const getBandPage = async (req, res) => {
    const bandKey = req.params.band_key; // URL에서 band_key 추출
    await bandListApi.getBandListUrl(req.session.access_token)
        .then(bandList => {
            const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기
            console.log("밴드 페이지 조회 test");
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

const getBandPairGame = async (req, res)=>{
    try {
        const bandKey = req.params.band_key; // URL에서 band_key 추출

        // 밴드 목록 가져오기
        const bandList = await bandListApi.getBandListUrl(req.session.access_token);
        const band = bandList.bands.find(b => b.band_key === bandKey); // 해당 밴드 찾기

        if (!band) {
            console.log('Band not found');
            return res.redirect('/?resultCd=L'); // 밴드가 없으면 리다이렉트
        }

        console.log("밴드 페어게임 조회 test");

        // 글 목록 가져오기
        const contentList = await contentListApi.getContentList(req.session.access_token, bandKey);
        console.log('Content List:', contentList);
        // 렌더링
        res.render('bandpairgame', {
            bandname: band.name,
            bandkey: band.band_key,
            contentList: contentList // 글 목록 전달
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

module.exports = { getMain, getBandPage, getBandPairGame, getBandDice };