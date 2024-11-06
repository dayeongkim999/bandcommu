const axios = require("axios");
const loginApi = require('../../conf/login_api');
const router = require('express').Router();

router.get('/callback', async (req, res)=>{
    const code = req.query.code;

    const bandAccessTokenUrl = loginApi.ACCESSTOKEN_URL + '&code=' + code;
    const base64Encoded = loginApi.getBase64Encoded();
    const options = {
      url: bandAccessTokenUrl,
      headers: {Authorization: 'Basic ' + base64Encoded}  
    };

    axios(options)
    .then(response=>{
        //인증 토큰
        const token = response.data.access_token;
        return token;
    })
    .then(token=>{
        //사용자 정보 조회 test
        const bandProfileUrl = loginApi.PROFILE_URL + '?access_token=' + token;
        axios(bandProfileUrl)
        .then(response=>{
            const body = response.data;

            if(body.result_code !== 1){
                console.log('naver band profile get error');
                response.redirect("/?resultCd=L");
                return;
            }

            res.render('login/login', {name: body.result_data.name});
        })
        .catch(error=>{
            if(error.response){
                console.log('naver band access token get response error : ' + error.response.status);
            } else{
                console.log('Error:', error.message);
            }
            console.error(error);
            res.redirect('/?resultCd=L');
        });
    }
    )
    .catch(error=>{
        if(error.response){
            console.log('naver band access token get response error : ' + error.response.status);
        } else{
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L');
    });

});

module.exports = router;