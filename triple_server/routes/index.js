var express = require('express');
var router = express.Router();
const {postEvents} = require('../controllers/events')
const getUserPoint = require('../controllers/getUserPoint')
console.log(postEvents)


/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Server Runing");
});

router.post('/events',function(req, res, next) {
  postEvents(req, res)

});
  
router.get('/getuserpoint/:userId', function(req, res, next){
  getUserPoint(req, res)
});

module.exports = router;
