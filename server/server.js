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
const BasicStrategy = require('passport-http').BasicStrategy

// simple express server
let express = require('express')
let app = express()
let router = express.Router()
let morgan = require('morgan')
let bodyParser = require('body-parser')

// custom models
let UserRoutes = require('./user/routes')
let UserDb = require('./user/model')

let child_process = require('child_process')

dotenv.load()

const csgrant = require('cloudsim-grant')

const port = process.env.PORT || 4000



// Here we get the public ip of this computer, and allow it as an origin
const hostIp  = child_process.execSync(
                'curl checkip.amazonaws.com').toString().trim()
const corsOptions = {
  origin: ['https://localhost:5000', 'https://' + hostIp + ':5000'],
  credentials: true
}

app.use(cors(corsOptions))
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
//  res.redirect('/')
  res.end()
});

app.post('/register', UserRoutes.register)
app.post('/unregister', UserRoutes.unregister)

app.get('/exists', UserRoutes.exists)

app.get('/admin',
  passport.authenticate('basic', {session:false}),
  // user.can('access admin page'),
  function (req,res) {
    let s = `
      <h1>Admin page</h1>
      Your user name is: ${req.user}
    `
    res.end(s);
})

app.get('/login',
  passport.authenticate('basic', {session:false}),
  // user.can('access admin page'),
  function (req,res) {
    const user = req.user.username
    csgrant.signToken({username:user}, function(err, token) {
      let s =
      {
        "username": user,
        "login": "success",
        "token" : token
      }
      console.log('login result: ' + JSON.stringify(s))
      res.jsonp(s)
    })
})

app.get('/token',
  passport.authenticate('basic', {session:false}),
  // user.can('access admin page')
  function (req,res) {
    console.log('get a token')
    console.log('  user: ' + JSON.stringify(req.user))
    console.log('  raw query:' + req.query)
    console.log('  query: ' + JSON.stringify(req.query))

    let tokenData = { username: req.user.username,
                      data:req.query,
                      timeout: 'never' }

    csgrant.signToken(tokenData, (token) =>{
      console.log('  signed ' + JSON.stringify(req.query) + ':' + token)
      res.jsonp({decoded: tokenData, success:true, token: token})
    })
})


console.log('listening on port ' + port)
console.log( 'serving from: ' + __dirname)

// http only
// app.listen(port);

// https
var httpsServer = https.createServer({key: privateKey, cert: certificate}, app)
httpsServer.listen(port)


