'use strict'

const express = require('express')
const router = express.Router()
const csgrant = require('cloudsim-grant')


function setRoutes(app) {

  // delete a group
  app.delete('/groups',
      csgrant.authenticate,
      function (req, res, next) {
        // put the group name in req.group
        req.group = req.body.resource
        next()
      },
      // check permissison for resource in req.group
      csgrant.ownsResource(':group', false),
      function (req, res) {

        csgrant.deleteResource(req.user, req.group, (err, data) => {
            let r = {};
            if (err) {
              r.success = false;
            }
            else {
              r.success = true;
            }
            r.resource = req.resourceData;
            res.jsonp(r);
          })

      }
  )

  // get all resources for a user
  // (get all the groups that the user is part of)
  app.get('/groups',
      csgrant.authenticate,
      csgrant.userResources,
      function (req, res, next) {
        // we're going to filter out the non
        // groups types before the next middleware.
        req.allResources = req.userResources
        req.userResources = req.allResources.filter( (obj)=>{
          if(obj.name.indexOf('group-') == 0)
            return true
          return false
        })
        next()
      },
      csgrant.allResources)

  // create a group
  app.post('/groups',
      csgrant.authenticate,
      csgrant.ownsResource('group', false),
      function (req, res) {
        const groupName = req.body.resource
        csgrant.getNextResourceId('group', (err, resourceName) => {
        if(err) {

          res.status(500).jsonp(error(err))
          return
        }

        csgrant.createResource(req.user, resourceName, {name: groupName}, (err, data) => {
          let r = {};
          if (err) {
            r.success = false
          }
          else {
            r.success = true
            r.result = data
            r.id = resourceName
          }
          res.jsonp(r);
        })
      })
   })
}

exports.setRoutes = setRoutes
