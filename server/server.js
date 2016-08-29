'use strict'

const fs = require('fs')
const cors = require('cors')
const dotenv = require('dotenv')
// ssl and https
const https = require('https')
const privateKey  = fs.readFileSync('key.pem', 'utf8')
const certificate = fs.readFileSync('key-cert.pem', 'utf8')

// authentication
const passport = require('passport')
const Auth0Strategy = require('passport-auth0');


// simple express server
let express = require('express')
let app = express()
let router = express.Router()
let morgan = require('morgan')
let bodyParser = require('body-parser')
var jwt = require('express-jwt');

let child_process = require('child_process')

dotenv.load()

const csgrant = require('cloudsim-grant')

const port = process.env.CLOUDSIM_PORT || 4000


// Here we get the public ip of this computer, and allow it as an origin
const hostIp  = child_process.execSync(
                'curl checkip.amazonaws.com').toString().trim()
const corsOptions = {
  origin: ['https://localhost:4000', 'https://localhost:5000',
           'https://' + hostIp + ':5000'],
  credentials: true
}

var localCallbackURL = 'https://localhost:' + port + '/';

// This will configure Passport to use Auth0
var strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  process.env.AUTH0_CALLBACK_URL || localCallbackURL
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });

// Auth0 nodejs API
var authenticate = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

app.use(cors(corsOptions))
app.use(passport.initialize())
passport.use(strategy)

// you can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// parse application/json
app.use(bodyParser.json())

app.use(morgan('combined'))
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendfile('./public/index.html');
})

app.get('/login',
  passport.authenticate('auth0'),
  function(req, res) {
    res.redirect('/');
  });


app.get('/token', authenticate,
  function (req,res) {

    var username = '';
    username = req.query.username;

    console.log('get a token')
    console.log('  user: ' + username)
    console.log('  query: ' + JSON.stringify(req.query))

    let tokenData = {username: username}

    csgrant.signToken(tokenData, (err, token) =>{
      console.log('  signed ' + JSON.stringify(req.query) + ':' + token)
      res.status(200).jsonp({decoded: tokenData, success:true, token: token});
    })
})

console.log('listening on port ' + port)
console.log( 'serving from: ' + __dirname)

// http only
// app.listen(port);

// Expose app
exports = module.exports = app;

// https
var httpsServer = https.createServer({key: privateKey, cert: certificate}, app)
httpsServer.listen(port)
