var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var bcrypt = require('bcrypt-nodejs');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var session = require('express-session');
var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'einstein',
  saveUninitialized: true,
  cookie: { secure: true }
}));
//function takes in a user
 function restrict (req,res,next){
  if(req.session.user){
    next();
  } else{
    req.session.error = 'Access denied';
    res.redirect('/login');
  }
  //check for session
  //if exists
}

app.get('/', restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', restrict,
function(req, res) {
  res.render('index');
});

app.get('/links', restrict,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login',
function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  var password = req.body.password;
  var username = req.body.username;
  new User({code1: username}).fetch().then(function(found) {
    console.log(found.attributes.code2 + " found here");
    if(found) {
      if(bcrypt.compareSync(password,found.attributes.code2)) {
        req.session.regenerate(function() {
          req.session.user = username;
          res.redirect('/');
        });
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/signup');
    }
  });
});

app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var password = req.body.password;
  var username = req.body.username;
  var salt = bcrypt.genSaltSync(8)
  var hashed = bcrypt.hashSync(password, salt);
  console.log(hashed + " hash test");
  new User({code1: username}).fetch().then(function(found) {
    if(found) {
      res.redirect('/login');
    } else{
      var user = new User({
        code1: username,
        code2: hashed

      });

      user.save().then(function(newUser) {
        Users.add(newUser);
        // res.send(200, newUser);
        req.session.regenerate(function() {
          req.session.user = username;
          res.redirect('/');
        });
    });
  }
  });
});

app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    });
});
/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
