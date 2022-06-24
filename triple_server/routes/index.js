var express = require('express');
var router = express.Router();
const postEvents = require('../controllers/events')
const getUserPoint = require('../controllers/checkpoint')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("hi!!!!!");
});

router.post('/events',function(req, res, next) {
    postEvents(req, res)
  });
  
//router.get('/aa', getUserPoint);

module.exports = router;
