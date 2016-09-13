'use strict'

const express = require('express')
const router = express.Router()
const csgrant = require('cloudsim-grant')
const jwt = require('jsonwebtoken');

let adminUser = 'admin'
if (process.env.CLOUDSIM_ADMIN)
  adminUser = process.env.CLOUDSIM_ADMIN;

const ManagementClient = require('auth0').ManagementClient;

function setRoutes(app) {

  // delete a group
  app.delete('/users/:userid',
             csgrant.authenticate,
             csgrant.userResources,
    function (req, res) {

      if (req.user !== req.userId || req.user !== adminUser) {
        const error = {success: false, error: "Permission Denied"}
        res.status(401).jsonp(error)
        return;
      }

      if (!req.auth0Id) {
        const error = {success: false, error: "Auth0 user_id missing"}
        res.status(401).jsonp(error)
        return;
      }

      // function to remove all resources for a user
      const deleteAllResources = function(index, items, cb) {
        if (index === items.length) {
          cb(null,  items)
          return
        }
        csgrant.deleteResource(req.user, items[index], function(err, resource) {
          if (err) {
            cb(err, resource)
            return;
          }
          deleteAllResources(++index, items, cb)
        })
      }

      // remove user resources
      deleteAllResources(0, req.userResources, function(delErr, data) {
        if (delErr) {
          res.status(500).jsonp(err)
          return
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

        const management = new ManagementClient({
          token: auth0Token,
          domain: process.env.AUTH0_DOMAIN
        });
        management.users.delete({id: req.auth0Id}, function (err) {
          if (err) {
            console.log('Error deleting auth0 user ' + JSON.stringify(err));
            res.jsonp(err);
            return
          }
          res.jsonp({success: true})
        })
      })
  })

  // user route parameter
  app.param('userid', function(req, res, next, id) {
    req.userId = id
    next()
  })
}

exports.setRoutes = setRoutes
