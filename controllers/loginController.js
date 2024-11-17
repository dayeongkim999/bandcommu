const axios = require("axios");
const loginApi = require('../services/login_api');
const bandListApi = require("../services/bandList_api");

const getLogin = async (req, res)=>{
    try {    
        const code = req.query.code;

        const bandAccessTokenUrl = loginApi.ACCESSTOKEN_URL + '&code=' + code;
        const base64Encoded = loginApi.getBase64Encoded();
        const options = {
            url: bandAccessTokenUrl,
            headers: {Authorization: 'Basic ' + base64Encoded}  
        };

        const {data} = await axios(options);

        // 인증 토큰 세션으로 저장
        req.session.token = data.access_token;

        res.redirect("/main");

    } catch(error){
        if (error.response) {
            console.log('naver band access token get response error : ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);

        // 오류 발생 시 리다이렉트
        res.redirect('/?resultCd=L');
    }
};

module.exports = {getLogin}

// .then(token=>{
//     사용자 정보 조회 test
//     const bandProfileUrl = loginApi.PROFILE_URL + '?access_token=' + token;
//     axios(bandProfileUrl)
//     .then(response=>{
//         const body = response.data;

//         if(body.result_code !== 1){
//             console.log('naver band profile get error');
//             response.redirect("/?resultCd=L");
//             return;
//         }
//         console.log("사용자 정보 조회 test");
//         return body.result_data.name;
//     })
//     .then(name=>{
//         밴드 목록 조회 test
//         bandListApi.getBandListUrl(token)
//         .then(bandList=>{
//             console.log("밴드 목록 조회 test");
//             res.render('login/login', {name: name, bandList: bandList.bands});
//         })
//         .catch(error=>{
//             if(error.response){
//                 console.log('cannot fetch Naver band list : ' + error.response.status);
//             } else{
//                 console.log('Error:', error.message);
//             }
//             console.error(error);
//             res.redirect('/?resultCd=L');
//         });
//     })
//     .catch(error=>{
//         if(error.response){
//             console.log('naver band access token get response error : ' + error.response.status);
//         } else{
//             console.log('Error:', error.message);
//         }
//         console.error(error);
//         res.redirect('/?resultCd=L');
//     });
// }
// )