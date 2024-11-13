require('dotenv').config({path: '../conf/.env'});

const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

const loginApi = require('../conf/login_api');
const loginRouter = require('./login/login');

const app = express();
const router = express.Router();
const port = 8080;

app.use('/', router);

const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

app.set('view engine', 'ejs');
app.set('views', '../views');

// SSL 인증서 읽기
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "../ssl/server.key")),
    cert: fs.readFileSync(path.join(__dirname, "../ssl/server.cert"))
};

// HTTPS 서버 시작
https.createServer(sslOptions, app).listen(port, () => {
    console.log(`HTTPS server running on https://localhost:${port}`);
});

router.get("/", (req, res) => {
    if(req.query.resultCd === 'L'){
        return res.render('error');
    }
    let bandLoginUrl = loginApi.getLoginUrl();
    res.render('index', {bandLoginUrl : bandLoginUrl});
});
