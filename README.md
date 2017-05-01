Cloudsim-auth is part of the [Cloudsim](https://bitbucket.org/osrf/cloudsim) project.

[ ![Codeship Status for osrf/cloudsim-auth](https://codeship.com/projects/d48e5670-0c06-0134-283f-368b7d3cc702/status?branch=default)](https://codeship.com/projects/156010)

[![Dependency Status](https://www.versioneye.com/user/projects/57ca2dec939fc60037ebcff7/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/57ca2dec939fc60037ebcff7)

[![Coverage Status](https://coveralls.io/repos/bitbucket/osrf/cloudsim-auth/badge.svg?branch=default)](https://coveralls.io/bitbucket/osrf/cloudsim-auth?branch=default)

# See the Cloudsim [wiki](https://bitbucket.org/osrf/cloudsim/wiki) for documentation #

# README #

This is the authentication server for Cloudsim and other web apps

### What is this repository for? ###

* A web app with users
* A json web token delivery

### How do I get set up? ###

* Dependencies: nodejs 4 and above, gulp (sudo npm install gulp -g)
  `sudo apt-get install -y nodejs npm nodejs-legacy redis-server`

* npm install
* gulp
* Database configuration: Redis for now
* How to run tests
* Deployment instructions

### Deployment ###

* Generate a private / public key pair for .env file

In cloudsim-grant directory, run:

`node generate_jwt_keys.js`

Put the result in a .env in the root of the project. The cloudsim-auth server
needs both keys, but other servers (cloudsim-sim, cloudsim-portal) only need
the public key in their .env file

Cloudsim uses Auth0 for authentication. Please make sure these Auth0 variables
are set in the .env file.

~~~
AUTH0_DOMAIN
AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET
~~~~

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin: hugo@osrfoundation.org
