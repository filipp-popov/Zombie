var PostSend = require('../components/post-sender');
var express = require('express');
var router = express.Router();
/* GET home page. */
router.post('/', function(req, res) {
    global.PeopleCoordinates = req.body;

    console.log('Post event: ');
    console.log({
        Query: req.query,
        Body: global.PeopleCoordinates
    });
    res.json(req.body);
    PostSend(global.PeopleCoordinates, 'post_event?area=zombie&id=sonar');
});

module.exports = router;


