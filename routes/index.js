var express  = require('express');
var passport = require('passport')
var mqtt     = require('mqtt');
var router   = express.Router();
var Data     = require('../model/Data');
const { renderSync } = require('node-sass');

/* GET home page. */
router.get('/', checkLogin, function(req, res) {
  res.redirect('dashboard');
});

router.get('/dashboard', checkLogin, function(req, res){
  const userSession = req.user;
  console.log(userSession);
  res.render('dashboard', {user: userSession});
})

router.get('/history', checkLogin, function(req, res){
  const userSession = req.user;
  console.log(userSession);
  res.render('history', {user: userSession});
})

router.get('/history/update', checkLogin, function(req, res){

  try{
    Data.find({}).sort({sendTime: 'descending'}).limit(100).exec(function(err, docs){
    if (err || (typeof docs[0] == 'undefined')){
      console.log("Query /Update get an error: ", err);
      res.send('false');
    }else{
      res.send(docs);
    }
  })}
  catch (err){
    console.log(err);
    res.send("fail");
  }
})

router.post('/history/excel', checkLogin, function(req, res){

  let fromTime = new Date(req.body['fromTime']);
  let toTime   = new Date(req.body['toTime']);

  console.log(req.body["fromTime"], req.body['toTime']);
  try{
    Data.find({"sendTime":{ $gte: fromTime, $lt: toTime }}).limit(200).exec(function(err, docs){
      if (err){
        console.log(err);
        req.send("error");
      }else{
        res.send(docs);
      }
    })

  }
  catch(e){
    console.log(e);
    req.send(false);
  }
 
})


router.get('/aboutus', checkLogin, function(req, res){
  const userSession = req.user;
  console.log(userSession);
  res.render('aboutus', {user: userSession});
})

router.get('/update', checkLogin, function(req, res){
  // To-do list here
  // Return new data from MQTT to update screen
  Data.find({}).sort({sendTime: 'descending'}).limit(1).exec(function(err, docs){
    if (err || (typeof docs[0] == 'undefined')){
      console.log("Query /Update get an error: ", err);
      res.send('false');
      //res.send({'total': Math.random()*100, 'sendTime': Date.now()});
    }else{
      let lastestDoc = docs[0].sendTime;
      let now = Date.now();
      console.log(now - lastestDoc);

      if ((now - lastestDoc) < 5000){
        // Có dữ liệu cách đây tối đa 5s
        res.send(docs[0]);
      }else{
        // Không có dữ liệu cách đây tối thiểu 5s
        res.send('false');
        //res.send({'total': Math.random()*100, 'sendTime': Date.now()});
      }
    }
  })
 
})

router.post('/send2PLC', checkLogin, function(req, res){
  console.log("Send to PLC")
  var client = mqtt.connect("mqtt://m24.cloudmqtt.com", {
    keepalive: 120,
    username: 'bdzsrzdm',
    password: 'lAbxfgDF7x-z',
    clean: true,
    port: 13107,
  });

  var options = {
    qos: 2,
  };

  function callback(result){
    console.log(result);
  }


  client.on('connect', function () {
    console.log('On Connected');
    // To-do list here
    if (typeof req.body['run'] != 'undefined') {
      client.publish('lequoccuong/write', `runn:${req.body['run']}`, options, callback);
    } 

    if (typeof req.body['web_emer'] != 'undefined') {
      client.publish('lequoccuong/write', `emer:${req.body['web_emer']}`, options, callback);
    }
    if (typeof req.body['web_reset'] != 'undefined') {
      client.publish('lequoccuong/write', `rese:${req.body['web_reset']}`, options, callback);
    } 

    if (typeof req.body['val_v1'] != 'undefined'){
      client.publish('lequoccuong/write', `val1:${req.body['val_v1']}`, options, callback);
    }
    if (typeof req.body['val_v2'] != 'undefined'){
      client.publish('lequoccuong/write', `val2:${req.body['val_v2']}`, options, callback);
    }
    if (typeof req.body['val_v11'] != 'undefined'){
      client.publish('lequoccuong/write', `va11:${req.body['val_v11']}`, options, callback);
    }
    if (typeof req.body['val_v22'] != 'undefined'){
      client.publish('lequoccuong/write', `va22:${req.body['val_v22']}`, options, callback);
    }

    client.end();
    res.send(true);
  })
  
})

router.get('/register', function(req, res){
  res.render('register');
});

router.post('/register',
  passport.authenticate("local-signup", {
    successRedirect: "/login",
    failureRedirect: "/register",
  })
)

router.get('/login', function(req, res){
  res.render('login');
})

router.post('/login', 
  passport.authenticate("local-signin", {
  successRedirect: "/dashboard",
  failureRedirect: "/login",
  })
)

router.get('/logout', checkLogin, function(req, res){
  req.logout();
  res.redirect('/');
})


router.get('/chartview', checkLogin, function(req, res){
  const userSession = req.user;
  res.render('chartview', {user: userSession});
})


function checkLogin(req, res, next){
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}


module.exports = router;
