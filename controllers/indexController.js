const loginApi = require('../services/login_api');

const getIndexPage = async (req, res) => {
    if(req.query.resultCd === 'L'){
        return res.render('error');
    }
    let bandLoginUrl = await loginApi.getLoginUrl();
    res.render('index', {bandLoginUrl : bandLoginUrl})};

module.exports = { getIndexPage };