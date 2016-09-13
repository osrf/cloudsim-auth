'use strict'

const express = require('express')
const router = express.Router()
const csgrant = require('cloudsim-grant')
const jwt = require('jsonwebtoken');

let adminUser = 'admin'
if (process.env.CLOUDSIM_ADMIN)
  adminUser = process.env.CLOUDSIM_ADMIN;

let Auth0ManagementClient;
if (process.env.AUTH0_API_KEY && process.env.NODE_ENV !== 'test')
  Auth0ManagementClient = require('auth0').ManagementClient;

function setRoutes(app) {

  // delete a group
  app.delete('/users/:userid',
             csgrant.authenticate,
             csgrant.userResources,
    function (req, res) {

      if (req.user !== req.userId && req.user !== adminUser) {
        const error = {success: false, error: "Permission Denied"}
        res.status(401).jsonp(error)
        return
      }

      if (!req.body.auth0Id) {
        const error = {success: false, error: "Auth0 user_id missing"}
        res.status(401).jsonp(error)
        return
      }

      csgrant.deleteUser(req.userId, function(err) {
        if (err) {
          res.status(500).jsonp(err)
          return
        }

        // remove user from auth0
        if (!Auth0ManagementClient) {
          res.jsonp({success: true})
          return;
        }

        // delete auth0 account
        // generate a token with delete scope
        // https://auth0.com/docs/api/management/v2/tokens
        const payload = {
                          "aud": process.env.AUTH0_API_KEY,
                          "scopes": {
                            "users": {
                              "actions": [
                                "delete"
                              ]
                            }
                          }
                        }
        let auth0Token = jwt.sign(payload,
            new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'))

        const management = new Auth0ManagementClient({
          token: auth0Token,
          domain: process.env.AUTH0_DOMAIN
        });
        management.users.delete({id: req.body.auth0Id}, function (err) {
          if (err) {
            console.log('Error deleting auth0 user ' + JSON.stringify(err));
            res.jsonp(err);
            return
          }
          res.jsonp({success: true})
        })
      })

/*      // function to remove all resources for a user
      const removeUserFromResources = function(index, items, cb) {

        if (index === items.length) {
          cb(null,  items)
          return
        }

        // remove resource only if there is no other user with write access
        const itemPermissions = items[index].permissions
        let remove = itemPermissions.length === 1 ? true : false
        if (remove) {
          // no one else has write access to resource so it's safe to remove
          csgrant.deleteResource(req.userId, items[index].name,
              function(err, resource) {
            if (err) {
              console.log('deleting resources err ' + JSON.stringify(err));
              cb(err, resource)
              return;
            }
            removeUserFromResources(++index, items, cb)
          })
        }
        else {
          // revoke user permission instead of deleting the resource
          let readOnly = true
          for (let i = 0; i < itemPermissions.length; ++i) {
            let item = itemPermissions[i]
            if (item.username === req.userId) {
              readOnly = item.permissions.readOnly;
              break
            }
          }
          console.log('b4 revoke resources err ');
          csgrant.revokePermission(req.userId, req.userId, items[index].name,
              readOnly, function(err, success, message) {
            if (err) {
              cb(err, message)
              return;
            }
            removeUserFromResources(++index, items, cb)
          })
        }

      }

      csgrant.readAllResourcesForUser(req.userId, (err, items) => {
        if (err) {
          res.status(500).jsonp(err);
          return
        }

        // remove user from resource permissions
        removeUserFromResources(0, items, function(delErr, data) {

          if (delErr) {
            res.status(500).jsonp(err)
            return
          }

          if (!Auth0ManagementClient) {
            res.jsonp({success: true})
            return;
          }

          // delete auth0 account
          // generate a token with delete scope
          // https://auth0.com/docs/api/management/v2/tokens
          const payload = {
                            "aud": process.env.AUTH0_API_KEY,
                            "scopes": {
                              "users": {
                                "actions": [
                                  "delete"
                                ]
                              }
                            }
                          }
          let auth0Token = jwt.sign(payload,
              new Buffer(process.env.AUTH0_CLIENT_SECRET, 'base64'))

          const management = new Auth0ManagementClient({
            token: auth0Token,
            domain: process.env.AUTH0_DOMAIN
          });
          management.users.delete({id: req.body.auth0Id}, function (err) {
            if (err) {
              console.log('Error deleting auth0 user ' + JSON.stringify(err));
              res.jsonp(err);
              return
            }
            res.jsonp({success: true})
          })
        })
      })*/
  })

  // user route parameter
  app.param('userid', function(req, res, next, id) {
    req.userId = id
    next()
  })
}

exports.setRoutes = setRoutes
