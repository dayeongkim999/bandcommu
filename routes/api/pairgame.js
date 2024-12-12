const express = require('express');
const router = express.Router();
const { getDeadline, getPairgameData } = require('../../controllers/pairgameController');
const checkLogin = require('../../middlewares/checkLogin');

// 마감 시간 반환 API
router.route('/deadline').get(checkLogin, getDeadline);
// 페어게임 데이터 반환 API
router.route('/data/:post_key').get(checkLogin, getPairgameData);

module.exports = router;
