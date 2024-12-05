const {TempLink, createTempLink, handleTempLink, findTempLinkbyUserId} = require("../models/templinkModel");

const makeTempLink = async (req, res)=>{
    try{
        //글 정보 받아오기

        //링크 만들기
        const tmplink = createTempLink();
        
        //화면에 보이기
    }
    catch(err){
        if (error.response) {
            console.log('Cannot make temp link: ' + error.response.status);
        } else {
            console.log('Error:', error.message);
        }
        console.error(error);
        res.redirect('/?resultCd=L'); // 실패 시 리다이렉트
    }
}