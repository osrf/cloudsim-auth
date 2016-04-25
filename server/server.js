'use strict'

let fs = require('fs')
let cors = require('cors')
const port = process.env.PORT || 5000

// ssl and https
let https = require('https')
let privateKey  = fs.readFileSync('key.pem', 'utf8')
let certificate = fs.readFileSync('key-cert.pem', 'utf8')

// authentication
var passport = require('passport')
var BasicStrategy = require('passport-http').BasicStrategy

// simple express server
let express = require('express')
let app = express()
let router = express.Router()
let morgan = require('morgan')

let bodyParser = require('body-parser')

// custom models
let UserRoutes = require('./user/routes')
let UserDb = require('./user/model')

/*
// Passport authentication
let user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    // optional function to customise code that runs when
    // user fails authorisation
    var accept = req.headers.accept || '';
    res.status(403);
    //if (~accept.indexOf('html')) {
    //  res.render('access-denied', {action: action});
    //} else {
      res.send('Access Denied - You don\'t have permission to ' + action);
    }
})
*/

app.use(passport.initialize())
// Use the BasicStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.
passport.use(new BasicStrategy({}, UserRoutes.verify ))

// parse application/json
app.use(bodyParser.json())

app.use(morgan('combined'))
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendfile('./public/index.html');
})

app.get('/about', function(req, res) {
  console.log('about')
  res.end('<h1>about</h1>')
})

app.get('/logout', function(req, res){
  req.logout()
  res.statusCode = 401
  res.redirect('/')
});

app.post('/register', UserRoutes.register)
app.post('/unregister', UserRoutes.unregister)

app.get('/admin',
        passport.authenticate('basic', {session:false}),
        // user.can('access admin page'),
        function (req,res) {
          let s = `
            <h1>Admin page</h1>
            Your user name is: ${req.user}
          ` + req.user
          res.end(s);
})

console.log('listening on port ' + port)
console.log( 'serving from: ' + __dirname)

// http only
// app.listen(port);

// https
var httpsServer = https.createServer({key: privateKey, cert: certificate}, app)
httpsServer.listen(port)


