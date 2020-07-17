// Config dotenv to init all variables in .env file
require('dotenv').config();

var createError  = require('http-errors');
var express      = require('express');
var path         = require('path');
var cookieParser = require('cookie-parser');
var logger       = require('morgan');
var mongoose     = require('mongoose');
var session      = require('express-session');
var passport     = require('passport');
var mqtt         = require('mqtt');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var Data = require('./model/Data');
var app = express();

mongoose.connect( process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
require('./passport')(passport);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret           : process.env.SECRET || 'xxxxxxxx', 
  cookie           : { maxAge: 24*60*60*1000 }, // maxAge = 24h
  resave           : true,                      // forces the session to be saved back to the store
  saveUninitialized: false                      // dont save unmodified
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/** 
 * Setup MQTT Client
 * Every receive data from MQTT Broker, will save to Database
*/
var client = mqtt.connect("mqtt://m24.cloudmqtt.com", {
  keepalive: 120,
  username: 'bdzsrzdm',
  password: 'lAbxfgDF7x-z',
  qos: 0,
  port: 13107
})

client.on('connect', function(){
  client.subscribe('lequoccuong/#', function (err) {
    if (!err) {
      console.log("Subcribe topic: lequoccuong/# success!");
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log('Receive a MQTT package: ', topic, message.toString());
  // Replace 'lequoccuong/test' to 'lequoccuong/read'
  if (topic.replace('lequoccuong/','') == 'read'){
    let objectMess = JSON.parse(message.toString());
    let data = new Data({
      run:      objectMess.run,
      web_emer: objectMess.web_emer,
      val_v11: objectMess.v11,
      val_v22: objectMess.v22,
      val_v1:  objectMess.v1,
      val_v2:  objectMess.v2,
      total:   objectMess.total,
    });

    data.save(function(err) {
      if (err)
          throw err;
      else
          console.log('save success');
    });

  }
  //client.end();
})

module.exports = app;
