'use strict'

const fs = require('fs')
const cors = require('cors')
const dotenv = require('dotenv')

// simple express server
const express = require('express')
const app = express()
const router = express.Router()
const morgan = require('morgan')
const bodyParser = require('body-parser')
const jwt = require('express-jwt')
const child_process = require('child_process')

//
const groups = require('./groups')

dotenv.load()

// csgrant
let dbName = 'cloudsim-auth'
if (process.env.NODE_ENV === 'test'){
  dbName = dbName + '-test'
}
const csgrant = require('cloudsim-grant')
let adminUser = 'admin'
if (process.env.CLOUDSIM_ADMIN)
  adminUser = process.env.CLOUDSIM_ADMIN;
const rootResource = 'root'
csgrant.init(adminUser, {'root': {}, 'group':{} }, dbName, ()=>{
  console.log( dbName + ' redis database loaded')
});


const port = process.env.PORT || 4000


// Here we get the public ip of this computer, and allow it as an origin
const hostIp  = child_process.execSync(
                'curl checkip.amazonaws.com').toString().trim()
const corsOptions = {
  origin: [
  'https://osrf.github.io',
  'https://cloudsim.io',
  'https://dev.cloudsim.io',
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

if (!process.env.AUTH0_CLIENT_SECRET) {
  console.log('No Auth0 client secret provided! Using fake secret');
  process.env.AUTH0_CLIENT_SECRET = 'secret'
}

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

app.get('/token',
        authenticate,
        function (req, res, next) {
          req.user = req.query.username
          next()
        },
        csgrant.userResources,
        function (req ,res) {

          let groups = []
          for (let i = 0; i < req.userResources.length; ++i) {
            groups.push(req.userResources[i].name)
          }

          console.log('get a token')
          console.log('  user: ' + req.user)
          console.log('  query: ' + JSON.stringify(req.query))

          let tokenData = {username: req.user, groups: groups}

          csgrant.signToken(tokenData, (err, token) =>{
            console.log('  signed ' + token)
            res.status(200).jsonp(
                {decoded: tokenData, success:true, token: token});
          })

})

groups.setRoutes(app)

// grant user permission to a resource
// (add user to a group)
app.post('/permissions',
    csgrant.authenticate,
    csgrant.grant)

// revoke user permission
// (delete user from a group)
app.delete('/permissions',
    csgrant.authenticate,
    csgrant.revoke)

// get all user permissions for all resources
// (get all users for all groups)
app.get('/permissions',
    csgrant.authenticate,
    csgrant.ownsResource(rootResource, true),
    csgrant.userResources,
    csgrant.allResources
)

// get user permissions for a resource
// (get users in a group)
app.get('/permissions/:resourceId',
    csgrant.authenticate,
    csgrant.ownsResource(':resourceId', true),
    csgrant.resource
)

/// param for resource name
app.param('resourceId', function(req, res, next, id) {
  req.resourceId = id
  next()
})


// Expose app
exports = module.exports = app;

// ssl and https
let httpServer = null

const useHttps = false
if(useHttps) {
  const privateKey  = fs.readFileSync(__dirname + '/key.pem', 'utf8')
  const certificate = fs.readFileSync(__dirname + '/key-cert.pem', 'utf8')
  httpServer = require('https').Server({
    key: privateKey, cert: certificate
  }, app)
}
else {
  httpServer = require('http').Server(app)
}
httpServer.listen(port)

console.log('listening on port ' + port)
console.log( 'serving from: ' + __dirname)
