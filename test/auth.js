'use strict'

const supertest = require('supertest');
const app = require('../server/server')
let agent;

describe('<Unit Test>', function() {

  before(function(done) {
    console.log('before')
    agent = supertest.agent(app);
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

  })
})
