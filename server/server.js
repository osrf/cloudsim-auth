'use strict'

const fs = require('fs')
const cors = require('cors')
const dotenv = require('dotenv')

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

const port = process.env.CLOUDSIM_PORT || 80


// Here we get the public ip of this computer, and allow it as an origin
const hostIp  = child_process.execSync(
                'curl checkip.amazonaws.com').toString().trim()
const corsOptions = {
  origin: [
  'https://osrf.github.io',
  'https://cloudsim.io',
  'https://cloudsim.io:5000',
  'http://localhost:8080',
  'https://localhost:5000',
  'https://localhost:4000',
  'https://' + hostIp + ':5000',
  'https://cloudsimwidgets-env.us-east-1.elasticbeanstalk.com:5000'],
  credentials: true
}

console.log('Supported origins for today: ' + JSON.stringify(corsOptions))

var localCallbackURL = 'https://localhost:' + port + '/';

if (!process.env.AUTH0_CLIENT_SECRET)
  console.log('No Auth0 client secret provided!');

// Auth0 nodejs API
var authenticate = jwt({
  secret: new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'),
  audience: process.env.AUTH0_CLIENT_ID
});

app.use(cors(corsOptions))

// parse application/json
app.use(bodyParser.json())

app.use(morgan('combined'))
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendfile('./public/index.html');
})

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

const httpServer = require('http').Server(app)
httpServer.listen(port, function(){
	console.log('listening on *:' + port);
});
