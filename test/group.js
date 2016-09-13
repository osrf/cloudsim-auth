'use strict';

console.log('test/group.js');

require('../server/server.js')

const csgrant = require('cloudsim-grant')

/// Module dependencies.
const app = require('../server/server')

const util = require('util');
const should = require('should');
const supertest = require('supertest');

// we need fresh keys for this test
const keys = csgrant.token.generateKeys()
csgrant.token.initKeys(keys.public, keys.private)

let adminUsername = 'admin';
if (process.env.CLOUDSIM_ADMIN)
  adminUsername = process.env.CLOUDSIM_ADMIN;

let groupResource = 'group';

let user2Username = 'user2';
let userToken = {};
const userTokenData = {username: adminUsername};
let user2Token = {};
const user2TokenData = {username: user2Username};

let agent;

describe('<Unit Test>', function() {

  before(function(done) {
    csgrant.model.clearDb()
    csgrant.token.signToken(userTokenData, (e, tok)=>{
      console.log('token signed for user "' + userTokenData.username  + '"')
      if(e) {
        console.log('sign error: ' + e)
      }
      userToken = tok
      csgrant.token.signToken(user2TokenData, (e, tok)=>{
        console.log('token signed for user "' + user2TokenData.username  + '"')
        if(e) {
          console.log('sign error: ' + e)
        }
        user2Token = tok
        done()
      })
    })
  })

  describe('Group Controller:', function() {
    before(function(done) {
      agent = supertest.agent(app);
      done()
    })

    describe('Check Non-Empty Groups for Admin', function() {
      it('should be part of admin-related groups at the beginning',
          function(done) {
        agent
        .get('/permissions')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          // admin should have 1) root permission and
          // 2) ability to create groups
          response.result.length.should.be.exactly(2);
          done();
        })
      })
    })

    const group1name = 'group1'
    let groupId1
    describe('Check Create Group', function() {
      it('should be possible to create a group', function(done) {
        const data = {resource: group1name};
        agent
        .post('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send(data)
        .end(function(err,res){
          should.not.exist(err);
          should.exist(res);
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          groupId1 = response.id
          done();
        })
      })
    })

    describe('Check New Group Created', function() {
      it('should be one new group', function(done) {
        agent
        .get('/groups')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(1)
          response.result[0].data.name.should.equal(group1name);
          done();
        })
      })
    })


    let groupId2
    describe('Check Admin Create Second Group', function() {
      it('should be possible to create another group', function(done) {
        const data = {resource: 'group2'};
        agent
        .post('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send(data)
        .end(function(err,res){
          should.not.exist(err);
          should.exist(res);
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true)
          groupId2 = response.id
          done();
        })
      })
    })

    describe('Check Two Groups Created', function() {
      it('should be two new groups', function(done) {
        agent
        .get('/groups')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(2)
          response.result[0].name.should.equal(groupId1);
          response.result[1].name.should.equal(groupId2);
          done();
        })
      })
    })


    describe('Check Remove Group', function() {
      it('should be possible to remove a group', function(done) {
        const data = {resource: groupId1};
        agent
        .delete('/groups')
        .send(data)
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          done();
        })
      })
    })


    describe('Check One Group Remaining', function() {
      it('should be one group left', function(done) {
        agent
        .get('/groups')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(1);
          response.result[0].name.should.equal(groupId2);
          done();
        })
      })
    })

    // create groupId3 for permission test
    let groupId3
    describe('Check Create Third Group', function() {
      it('should be possible to create a third group', function(done) {
        const data = {resource: 'group3'};
        agent
        .post('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send(data)
        .end(function(err,res){
          should.not.exist(err);
          should.exist(res);
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true)
          groupId3 = response.id
          done();
        })
      })
    })

    // verify admin permission query for accessing group
    describe('Check Admin Permission to Access Group', function() {
      it('should be possible for admins to access group',
          function(done) {
        agent
        .get('/permissions/' + groupId3)
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.name.should.equal(groupId3);
          response.result.permissions.should.not.be.empty();
          const perm = response.result.permissions[0];
          perm.username.should.equal(adminUsername);
          perm.permissions.readOnly.should.equal(false);
          done()
        })
      })
    })

    // verify user permission query for accessing group
    describe('Check User Permission to Access Group:', function() {
      it('should not have access to group without permission',
          function(done) {
        agent
        .get('/permissions/' + groupId3)
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(401);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(false);
          done();
        })
      })
    })

    // user2 has no read/write permission to any group
    describe('Check Get Group without Read Permission', function() {
      it('should not be able to see any groups',
          function(done) {
        agent
        .get('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(0);
          done();
        })
      })
    })

    // give user2 read permission to groupId2
    describe('Grant Read Permission', function() {
      it('should be possible to grant user read permission', function(done) {
        agent
        .post('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId2, grantee: user2Username, readOnly: true})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text)
          response.success.should.equal(true);
          response.resource.should.equal(groupId2);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(true);
          done();
        })
      })
    })

    // verify user permission query for accessing group after being granted
    // permision
    describe('Check User Permission to Access Group', function() {
      it('should have access to group with permission',
          function(done) {
        agent
        .get('/permissions/' + groupId2)
        .set('authorization', user2Token)
        .set('Acccept', 'application/json')
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.name.should.equal(groupId2);
          response.result.permissions.should.not.be.empty();
          response.result.permissions.length.should.equal(2);
          // requester user permissions are at position 0
          let puser2 = response.result.permissions[0];
          puser2.username.should.equal(user2Username);
          puser2.permissions.readOnly.should.equal(true);
          let padmin = response.result.permissions[1];
          padmin.username.should.equal(adminUsername);
          padmin.permissions.readOnly.should.equal(false);
          done();
        })
      })
    })

    // user2 should be able to see groupId2
    describe('Check Get Group with Read Permission', function() {
      it('should be able to see only one group',
          function(done) {
        agent
        .get('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(1);
          // group 2 consists of admin with write access
          // and user with read access
          response.result[0].name.should.equal(groupId2);
          const group2Perm = response.result[0].permissions;
          group2Perm.length.should.be.exactly(2);
          group2Perm[0].username.should.equal(user2Username);
          group2Perm[0].permissions.readOnly.should.equal(true);
          group2Perm[1].username.should.equal(adminUsername);
          group2Perm[1].permissions.readOnly.should.equal(false);
          done();
        })
      })
    })


    describe('Check Remove Group without Write Permission', function() {
      it('should not be able to remove group without write permission',
          function(done) {
        const data = {resource: groupId2};
        agent
        .delete('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .send(data)
        .end(function(err,res){
          res.status.should.be.equal(401);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(false);
          done();
        })
      })
    })


    // give user2 write permission to groupId3
    describe('Grant Write Permission', function() {
      it('should be possible to grant user write permission', function(done) {
        agent
        .post('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId3, grantee: user2Username, readOnly: false})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.resource.should.equal(groupId3);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(false);
          done();
        })
      })
    })

    // user2 should be able to see groupId2 and groupId3
    describe('Check Get Group with Read/Write Permission', function() {
      it('should be able to see two groups', function(done) {
        agent
        .get('/groups')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(2);
          // group 2 consists of admin with write access
          // and user with read access
          response.result[0].name.should.equal(groupId2);
          const group2Perm = response.result[0].permissions;
          group2Perm.length.should.be.exactly(2);
          group2Perm[0].username.should.equal(user2Username);
          group2Perm[0].permissions.readOnly.should.equal(true);
          group2Perm[1].username.should.equal(adminUsername);
          group2Perm[1].permissions.readOnly.should.equal(false);
          // group 3 consists of admin with write access
          // and user with write access
          response.result[1].name.should.equal(groupId3);
          const group3Perm = response.result[1].permissions;
          group3Perm.length.should.be.exactly(2);
          group3Perm[0].username.should.equal(user2Username);
          group3Perm[0].permissions.readOnly.should.equal(false);
          group3Perm[1].username.should.equal(adminUsername);
          group3Perm[1].permissions.readOnly.should.equal(false);
          done();
        })
      })
    })

    // user2 should be able to remove groupId3
    describe('Check Remove Group with Write Permission', function() {
      it('should be able to remove group with write permission',
          function(done) {
        const data = {resource: groupId3};
        agent
        .delete('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .send(data)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          done();
        })
      })
    })

    // verify groupId3 is removed
    describe('Check One Group Remaining', function() {
      it('should be one group', function(done) {
        agent
        .get('/groups')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(1);
          done();
        })
      })
    })

    // create groupId4 for revoke permission test
    let groupId4
    describe('Check Create Fourth Group', function() {
      it('should be possible to create a fourth group', function(done) {
        const data = {resource: 'group4'};
        agent
        .post('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send(data)
        .end(function(err,res){
          should.not.exist(err);
          should.exist(res);
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          groupId4 = response.id
          done();
        })
      })
    })

    // give user2 read permission to groupId4
    describe('Grant Read Permission', function() {
      it('should be possible to grant user read permission to more groups',
          function(done) {
        agent
        .post('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId4, grantee: user2Username, readOnly: true})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text)
          response.success.should.equal(true);
          response.resource.should.equal(groupId4);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(true);
          done();
        })
      })
    })

    // user2 should be able to see groupId2 and groupId4
    describe('Verify User Read/Write Permission', function() {
      it('should be able to see two groups', function(done) {
        agent
        .get('/groups')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(2);
          response.result[0].name.should.equal(groupId2);
          response.result[1].name.should.equal(groupId4);
          done();
        })
      })
    })

    // revoke user2's read permission to groupId4
    describe('Revoke Read Permission', function() {
      it('should be possible to revoke user read permission',
          function(done) {
        agent
        .delete('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId4, grantee: user2Username, readOnly: true})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.resource.should.equal(groupId4);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(true);
          done();
        })
      })
    })

    // user2 should be able to see groupId2 but not groupId4
    describe('Verify Revoke User Read Permission', function() {
      it('should be able to see one group', function(done) {
        agent
        .get('/groups')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.result.length.should.be.exactly(1);
          response.result[0].name.should.not.be.empty();
          response.result[0].name.should.be.equal(groupId2);
          done();
        })
      })
    })

    // update user2's read permission to write permission to groupId2
    describe('Update Read to Write Permission', function() {
      it('should be possible to update user from read to write permission',
          function(done) {
        agent
        .post('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId2, grantee: user2Username, readOnly: false})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.resource.should.equal(groupId2);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(false);
          done();
        })
      })
    })

    // verify permission query for accessing group
    describe('Verify Update User Write Permission', function() {
      it('should be able to see write permission in user permission list',
          function(done) {
        agent
        .get('/permissions/' + groupId2)
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.name.should.equal(groupId2);
          response.result.permissions.should.not.be.empty();
          response.result.permissions.length.should.be.exactly(2);
          const perm1 = response.result.permissions[0];
          perm1.username.should.equal(adminUsername);
          perm1.permissions.readOnly.should.equal(false);
          const perm2 = response.result.permissions[1];
          perm2.username.should.equal(user2Username);
          perm2.permissions.readOnly.should.equal(false);
          done()
        })
      })
    })

    // verify user2's write permission to groupId2 cannot be revoked
    // using readOnly = true
    describe('Revoke Write Permission with ReadOnly flag', function() {
      it('should not be possible to revoke user write permission with read',
          function(done) {
        agent
        .delete('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId2, grantee: user2Username, readOnly: true})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(false);
          done();
        })
      })
    })

    // revoke user2's write permission to groupId2
    describe('Revoke User Write Permission', function() {
      it('should be able to revoke write permission', function(done) {
        agent
        .delete('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupId2, grantee: user2Username, readOnly: false})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          done();
        })
      })
    })

    // user2 should not be able to see any groups
    describe('Verify Revoke User Write Permission', function() {
      it('should not be able to see any groups', function(done) {
        agent
        .get('/groups')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.result.length.should.be.exactly(0);
          done();
        })
      })
    })

    // give user2 permission to create groups
    describe('Grant Permission to Create Groups', function() {
      it('should be possible to grant user permission to create groups',
          function(done) {
        agent
        .post('/permissions')
        .set('Acccept', 'application/json')
        .set('authorization', userToken)
        .send({resource: groupResource, grantee: user2Username,
            readOnly: false})
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text)
          response.success.should.equal(true);
          response.resource.should.equal(groupResource);
          response.grantee.should.equal(user2Username);
          response.readOnly.should.equal(false);
          done();
        })
      })
    })

    // verify user2 will be able to create a group
    const group5name = 'group5'
    let groupId5
    describe('Check User Create Group', function() {
      it('should be possible for user to create a group', function(done) {
        const data = {resource: group5name};
        agent
        .post('/groups')
        .set('Acccept', 'application/json')
        .set('authorization', user2Token)
        .send(data)
        .end(function(err,res){
          should.not.exist(err);
          should.exist(res);
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          groupId5 = response.id
          done();
        })
      })
    })

    // verify group5 is created
    describe('Check New Group Created by User', function() {
      it('should be one new group', function(done) {
        agent
        .get('/groups')
        .set('authorization', user2Token)
        .end(function(err,res){
          res.status.should.be.equal(200);
          res.redirect.should.equal(false);
          const response = JSON.parse(res.text);
          response.success.should.equal(true);
          response.result.length.should.be.exactly(1)
          response.result[0].name.should.equal(groupId5);
          response.result[0].data.name.should.equal(group5name);
          done();
        })
      })
    })

    after(function(done) {
      // clear the database
      csgrant.model.clearDb()
      done()
    })
  })
})
