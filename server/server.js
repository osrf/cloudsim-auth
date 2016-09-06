'use strict'

const fs = require('fs')
const cors = require('cors')
const dotenv = require('dotenv')
// ssl and https
const https = require('https')
const privateKey  = fs.readFileSync('key.pem', 'utf8')
const certificate = fs.readFileSync('key-cert.pem', 'utf8')

// simple express server
let express = require('express')
let app = express()
let router = express.Router()
let morgan = require('morgan')
let bodyParser = require('body-parser')
var jwt = require('express-jwt');

let child_process = require('child_process')

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
csgrant.init(adminUser, {'root': {} }, dbName, ()=>{
  console.log( dbName + ' redis database loaded')
});

// grant admins permission to create groups
const groupResource = 'group'
csgrant.createResource(adminUser, groupResource, {},
      (err, data) => {
    if (err) {
      console.log('create group error:' + err)
      return;
    }
});


const port = process.env.CLOUDSIM_PORT || 4000


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


// create a group
app.post('/groups',
    csgrant.authenticate,
    csgrant.ownsResource(groupResource, false),
    function (req, res) {
      const group = req.body.resource;
      csgrant.createResource(req.user, group, {}, (err, data) => {
        let r = {};
        if (err) {
          r.success = false;
        }
        else {
          r.success = true;
        }
        res.jsonp(r);
      })
    }
)

// delete a group
app.delete('/groups',
    csgrant.authenticate,
    function (req, res) {
      const group = req.body.resource;
      // check permission - only user with write access can grant permission
      csgrant.isAuthorized(req.user, group, false, (err, authorized) => {
        if (err) {
          return res.jsonp({success: false, error: err})
        }
        if (!authorized) {
          const msg = 'insufficient permission for user "'
              + req.user + '"'
          return res.jsonp({success: false, error: msg})
        }
        csgrant.deleteResource(req.user, group, (err, data) => {
          let r = {};
          if (err) {
            r.success = false;
          }
          else {
            r.success = true;
          }
          r.resource = group;
          res.jsonp(r);
        })
      })
    }
)

// get all the groups that the user is part of
// return res.result: ['group', group', ...]
app.get('/groups',
    csgrant.authenticate,
    csgrant.userResources,
    csgrant.allResources)

// add user to a group
app.post('/permissions',
    csgrant.authenticate,
    function (req, res) {

      const group = req.body.resource;
      const grantee = req.body.grantee;
      const readOnly = req.body.readOnly;

      // check permission - only user with write access can grant permission
      csgrant.isAuthorized(req.user, group, false, (err, authorized) => {
        if (err) {
          return res.jsonp({success: false, error: err})
        }
        if (!authorized) {
          const msg = 'insufficient permission for user "'
              + req.user + '"'
          return res.jsonp({success: false, error: msg})
        }
        csgrant.grantPermission(req.user, grantee, group, readOnly,
            (err, success, message) => {
          let r = {};
          if (err) {
            r.success = false;
          }
          else {
            r.success = success;
          }
          r.resource = group;
          r.grantee = grantee;
          r.readOnly = readOnly;
          res.jsonp(r);
        })
      })
    }
)

// delete user from a group
app.delete('/permissions',
    csgrant.authenticate,
    function (req,res) {

      const group = req.body.resource;
      const grantee = req.body.grantee;
      const readOnly = req.body.readOnly;

      // check permission - only user with write access can revoke permission
      csgrant.isAuthorized(req.user, group, false, (err, authorized) => {
        if (err) {
          return res.jsonp({success: false, error: err})
        }
        if (!authorized) {
          const msg = 'insufficient permission for user "'
              + req.user + '"'
          return res.jsonp({success: false, error: msg})
        }

        csgrant.revokePermission(req.user, grantee, group, readOnly,
            (err, success, message) => {
          let r = {};
          if (err) {
            r.success = false;
          }
          else {
            r.success = success;
          }
          r.resource = group;
          r.grantee = grantee;
          r.readOnly = readOnly;
          res.jsonp(r);
        })
      })
    }
)

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


console.log('listening on port ' + port)
console.log( 'serving from: ' + __dirname)

// http only
// app.listen(port);

// Expose app
exports = module.exports = app;

// https
var httpsServer = https.createServer({key: privateKey, cert: certificate}, app)
httpsServer.listen(port)
