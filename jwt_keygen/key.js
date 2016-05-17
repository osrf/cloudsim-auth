'use strict'

let jwt = require('jsonwebtoken')
var NodeRSA = require('node-rsa')


function generateKeys(){
  var key = new NodeRSA({b: 512, e: 5});

    key.setOptions({
        encryptionScheme: {
        scheme: 'pkcs1',
        label: 'Optimization-Service'
    },
    signingScheme: {
        saltLength: 25
    }
  });

  return {
        "private" : key.exportKey('pkcs1-private-pem'),
        "public"  : key.exportKey('pkcs8-public-pem')
  };
}

var keys = generateKeys()



let priv = keys.private
let pub = keys.public

console.log('priv:' + priv)
console.log('pub:' + pub)

let data = {role:'admin', color:'blue'}

console.log('\n\ndata: ' + JSON.stringify(data) )
var token;


jwt.sign(data, priv, { algorithm: 'RS256' }, (token) => {  // , {algorithm: 'RS256'})
  console.log('token: ' + token)

  var d = jwt.decode(token)
  console.log('d: ' + JSON.stringify(d))

  jwt.verify(token, pub,  {algorithms: ['RS256']}, (err, decoded) => {
    console.log('err: ' + err)
    console.log('decoded: ' + JSON.stringify(decoded))
  })

})

