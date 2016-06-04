'use strict'

//
// [key / value] pairs for the database
// leaderboard/user_count is a user id generator
// leaderboard/usermap is a hmap of username to ids
// leaderboard/users/$id contains the username, id, password
// leaderboard/events/$id contains a list of sim events

var util = require('util')
var redis = require("redis").createClient();

var exports = module.exports = {};


let DB = 'cloudsim-auth'

if (process.env.NODE_ENV === "test") {
  console.log('cloudsim-auth/server/user/model.js NODE_ENV: ',
    process.env.NODE_ENV)
  // test mode...
  // use the test list instead of the live one
  DB = 'cloudsim-auth-test'
}

let usermap = DB + '/usermap'

function getUserPath(id) {
  let s = DB + '/users/' + id
  return s
}

function getEventsPath(id) {
  let s = DB + '/events/' + id
  return s
}

redis.on("error", function (err) {
        console.log("Error " + err);
    });

exports.getByName = function(username, cb) {

  console.log('user.getByName');
  redis.hget(usermap, username, function (err, userId) {
    if(err) {
      console.log(usermap + ' error: ' + err)
      cb(err)
    }
    if(!userId) {
      console.log(username + ' Not found')
      cb(null)
    }
    else {
      console.log('Found: ' + userId)
      let uPath = getUserPath(userId)
      redis.get(uPath, function(err, user) {
        if(err) {
          console.log(uPath + ' error: ' + err)
          cb(err)
        }
        if(!user) {
          let e = 'can\'t locate user data: ' + uPath
          console.log('error: ' + e)
          cb(e)
        }
        else {
          console.log(username + ' verified')
          cb(null, JSON.parse(user))
        }
      })
    }
  })
}


exports.add = function (username, password, role, cb) {
  console.log('[add user] ' + username + ', role: ' + role )
  redis.incr(DB + '/user_count', function (err, id) {
    redis.hmset( usermap, username, id, function (err) {
      if(err) {
        console.log(usermap + ' add user error ' + err)
        cb(err)
        return
      }
      let juser = {'username': username,
                   'password': password,
                   'role': role, 'id':id }
      redis.set(getUserPath(id), JSON.stringify(juser), function (err) {
        if(err) {
          console.log('error adding user ' + err);
          cb(err)
          return
        }
        cb(null, {'username': username, 'role': role, 'id': id})
      });
    });
  });
}


// this function requires the name and id, and
// it does not check for correct password
exports.remove = function (username, userId, cb) {

  console.log('[remove user] ' + username)
  // remove username from the user map
  redis.hdel(usermap, username, function(err) {
    if (err) {
      console.log(usermap + ' [hdel error]: ' + err)
      cb(err)
      return
    }
    let uPath =getUserPath(userId)
    console.log('remove user data ' + uPath)
    redis.del(uPath, function(err) {
      if (err) {
        console.log(uPath + ' [del] error: ' + err)
        cb(err)
        return
      }
      let ePath = getEventsPath(userId)
      console.log('remove user events ' + ePath)
      redis.del(ePath, function(err) {
        if(err) {
          console.log( ePath + ' [del] err: ' + err)
          cb(err)
          return
        }
        // success
        console.log('remove done')
        cb(null, {username: username, id: userId} )
      })
    })
  })
}


