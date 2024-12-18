require('dotenv').config({path: './conf/.env'});

const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const helmet = require('helmet');
const cors = require("cors");
const methodOverride = require("method-override");
const dbConnect = require("./conf/dbConnect");
const cookieParser = require('cookie-parser');

const app = express();
const httpPort = 9131;
const httpsPort = 8080;
const ex_port = 9131;

dbConnect();

app.options('*', cors()); // OPTIONS 요청 허용
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(methodOverride("_method"));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_CONNECT,
        collectionName: 'sessions'}),
    cookie:{
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        httpOnly: true,
        secure: true,
        sameSite: 'strict'
    }
}));

const staticPath = path.join(__dirname, './public');
app.use(express.static(staticPath));

app.use('/', require("./routes/indexRoutes"));
app.use('/login', require('./routes/loginRoutes'));
app.use('/main', require("./routes/mainRoutes"));
app.use('/api/pairgame', require("./routes/api/pairgame")); // /api/pairgame 경로와 라우터 연결
app.use('/external', require("./routes/externalRoutes"));

app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });

// HSTS 설정 (1년 동안 HTTPS 강제)
app.use(helmet.hsts({
    maxAge: 31536000, // 1년 (초 단위)
    includeSubDomains: true, // 하위 도메인 포함
    preload: false // HSTS Preload 리스트에 등록
}));

// SSL 인증서 읽기
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "./ssl/server.key")),
    cert: fs.readFileSync(path.join(__dirname, "./ssl/server.cert"))
};

// HTTPS 서버 시작
https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`HTTPS server running on https://localhost:${httpsPort}`);
});