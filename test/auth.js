'use strict'

const csgrant = require('cloudsim-grant')
const supertest = require('supertest');
const app = require('../server/server')
const jwt = require('jsonwebtoken');

let agent;

let adminUsername = 'admin';
if (process.env.CLOUDSIM_ADMIN)
  adminUsername = process.env.CLOUDSIM_ADMIN;

describe('<Unit Test>', function() {

  before(function(done) {
    // create superagent
    agent = supertest.agent(app)
    done()
  })

  describe('Authentication:', function(){
    it('should be able to access the landing page', (done) => {
      agent
      .get('/')
      .end(function(err,res){
        res.status.should.be.equal(200);
        res.redirect.should.equal(false);
        done();
      });
    })

    it('should not be able to get token without authorization', (done) => {
      agent
      .get('/token')
      .end(function(err,res){
        res.status.should.be.equal(401);
        res.redirect.should.equal(false);
        done();
      });
    })

    it('should be able to get token with authorization', (done) => {
      const payload = {aud: process.env.AUTH0_CLIENT_ID}
      const auth0Token = jwt.sign(payload,
          new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'))
      agent
      .get('/token')
      .set('Acccept', 'application/json')
      .query({username: adminUsername})
      .set('authorization', 'Bearer ' + auth0Token)
      .end(function(err,res){
        res.status.should.be.equal(200);
        res.redirect.should.equal(false);
        // verify token data
        const response = JSON.parse(res.text)
        response.should.not.be.empty()
        csgrant.verifyToken(response.token, (err, decoded) => {
          decoded.identities.length.should.be.greaterThan(0)
          const userIdx = decoded.identities.indexOf(adminUsername)
          userIdx.should.be.greaterThanOrEqual(0)
          done()
        })
      })
    })
  })

  after(function(done) {
    done()
  })
})
