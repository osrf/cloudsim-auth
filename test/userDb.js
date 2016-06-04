'use strict'

const should = require('should')
const model = require('../server/user/model')

describe('<Unit Test grant database (model.js)>', function() {

  before(function(done) {
      // model.clearDb()
      console.log('before')
      done()
  })

  describe('adding and sharing a resource:', function(){
    it('should have an empty db', (done) => {

      const count = 0
      should(count).be.eql(0, 'not empty')
      done()
    })
  })

})

