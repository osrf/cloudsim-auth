'use strict'

const fs = require('fs')
const path = require('path')
const cors = require('cors')
const dotenv = require('dotenv')

// simple express server
const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser')
const jwt = require('express-jwt')
const child_process = require('child_process')

// cloudsim
const groups = require('./groups')

dotenv.load()

// csgrant
let dbName = 'cloudsim-auth'
const dbUrl = process.env.CLOUDSIM_AUTH_DB || 'localhost'


if (process.env.NODE_ENV === 'test'){
  dbName = dbName + '-test'
}
const csgrant = require('cloudsim-grant')
let adminUser = 'admin'
if (process.env.CLOUDSIM_ADMIN)
  adminUser = process.env.CLOUDSIM_ADMIN;


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
    'https://' + hostIp + ':5000'],
  credentials: true
}

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

// this serves the swagger pages under /api
app.use("/api", express.static(path.join(__dirname, '/../public')))

app.get('/token', authenticate,
  function (req, res, next) {
    req.user = req.query.username
    req.identities = [req.user]
    next()
  },
  csgrant.userResources,
  function (req ,res) {

    let userResources = req.userResources.filter( (obj)=>{
      if(obj.name.indexOf('group-') == 0)
        return true
      return false
    })

    let groups = []
    for (let i = 0; i < userResources.length; ++i) {
      groups.push(userResources[i].data.name)
    }

    console.log('get a token')
    console.log('  user: ' + req.user)
    console.log('  query: ' + JSON.stringify(req.query))

    let identities = [req.user]
    identities = identities.concat(groups)
    let tokenData = {identities: identities}

    csgrant.signToken(tokenData, (err, token) =>{
      console.log('  signed ' + token)
      res.status(200).jsonp(
          {decoded: tokenData, success:true, token: token})
    })
  })

// setup the /permissions routes
csgrant.setPermissionsRoutes(app)
groups.setRoutes(app)

// Expose app
exports = module.exports = app;


function details() {
  const date = new Date()
  const version = require('../package.json').version
  const csgrantVersion = require('cloudsim-grant/package.json').version
  const env = app.get('env')
  const origins = JSON.stringify(corsOptions, null, 2)
  const s = `
date: ${date}
cloudsim-auth version: ${version}
cloudsim-grant version: ${csgrantVersion}
port: ${port}
admin user: ${adminUser}
environment: ${env}
redis database name: ${dbName}
redis database url: ${dbUrl}
supported origins: ${origins}
`
  return s
}

console.log('\n\n')
console.log('============================================')
console.log(details())
console.log('============================================')
console.log('\n\n')


app.get('/', function (req, res) {
  const info = details()
  const repo = require('../package.json').repository.url
  const s = `
<html>
  <body>
    <img src="api/images/cloudsim.svg" style="height: 2em"/>
    <h1>Cloudsim-auth server</h1>
    <div>Authentication server is running</div>
    <pre>
    ${info}
    </pre>
    <a href="/api">API documentation</a>
    <br>
    <a href="${repo}">source code repository</a>
  </body>
</html>
`
  res.end(s)
})


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

const resources = [
  {
    name: 'root',
    data : {},
    permissions: [
      {
        username: adminUser,
        permissions: {
          readOnly: false
        }
      }
    ]
  },
  {
    name: 'group',
    data:{},
    permissions: [
      {
        username: adminUser,
        permissions: {
          readOnly: false
        }
      }
    ]
  }
]

csgrant.init(resources,
  dbName,
  dbUrl,
  httpServer,
  ()=>{
    console.log( dbName + ' redis database loaded')
    httpServer.listen(port)
  })



