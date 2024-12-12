const os = require('os');
require('dotenv').config();

let loginApi = {
    CLIENT_ID : process.env.CLIENT_ID,
    CLIENT_SECRET : process.env.CLIENT_SECRET,
    AUTHORIZE_URL : 'https://auth.band.us/oauth2/authorize?response_type=code',
    ACCESSTOKEN_URL : 'https://auth.band.us/oauth2/token?grant_type=authorization_code',
    PROFILE_URL : 'https://openapi.band.us/v2/profile',
    BAND_LIST_URL : 'https://openapi.band.us/v2.1/bands',
    POST_LIST_URL: 'https://openapi.band.us/v2/band/posts',
    POST_READ_URL: 'https://openapi.band.us/v2.1/band/post',
    POST_CREATE_URL : 'https://openapi.band.us/v2.2/band/post/create',
    COMMENT_LIST_URL: 'https://openapi.band.us/v2/band/post/comments',
    PERMISSION_URL: 'https://openapi.band.us/v2/band/permissions',
    getLoginUrl : function(clubSn){
        let hostname = os.hostname();
        let redirectURI;
        if(hostname === 'DESKTOP-OIV4OJQ'){
            redirectURI = encodeURI('https://localhost:8080/login/callback'); //개발
        }else{
            redirectURI = encodeURI('https://10.10.15.133:9131/login/callback'); //운영
        }
        return this.AUTHORIZE_URL + '&client_id=' + this.CLIENT_ID + '&redirect_uri=' + redirectURI; 
    },
    getBase64Encoded : function(){
        return Buffer.from(this.CLIENT_ID + ':' + this.CLIENT_SECRET).toString('base64');
    }
}

module.exports = loginApi;