const bandListApi = require("../services/bandList_api");

bandListApi

const getMain = async (req, res) => {
    //밴드 목록 조회
    bandListApi.getBandListUrl(req.session.access_token)
        .then(bandList => {
            console.log("밴드 목록 조회 test");
            res.render('main', { bandList: bandList.bands });
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

module.exports = { getMain };