var express = require('express');
var router = express.Router();
const userModel = require('./users');
const groupModel = require('./groups');
const passport = require('passport');
const localStrategy = require('passport-local');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', isLoggedIn, function(req, res, next) {
  res.render('index', {user: req.user});
});

router.get('/register', (req, res, next) => {
  res.render('register')
})

router.post('/register', function(req, res, next){
  const createdUser = new userModel({
    username: req.body.username,
    contact: req.body.contact,
  })
  userModel.register(createdUser, req.body.password)
  .then(function(){
    passport.authenticate('local')(req, res, function(){
      res.redirect('/');
    })
  })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}), function(){})

router.get('/logout', function(req, res, next){
  req.logout(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/login');
  })
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}

router.get('/login', function(req, res, next){
  res.render('login');
})

module.exports = router;
