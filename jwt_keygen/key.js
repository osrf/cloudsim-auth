'use strict'

let jwt = require('jsonwebtoken')
var NodeRSA = require('node-rsa')

/*
let priv = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAtlPiN0+NvmyzTxxFs+9oRPsvRpOeVV/BTT6lFb7UAt088Tpr
0HK9czEfKmP4t786A8LmP7ag0f7+8SeDEwkzIDmzdKU3gA6ZQO9p4M/acVY2d1Fq
ecjElNsoP9Y13It9arnuH9ReR2YZmf34ddhYRnRkJVbbBnnSzWLu5RW8X+LzYC7f
aHN1/WRNkO02J0AuDMaLewpgE+8xW/i8wjXouVordmuMPTuoDeoRtSAgkVEn4vEY
OIA5oipACIALcu4hpzhbVKCaBAP27I0lsUyABrOuWp1/k37Sw4Bz10jcepAuKPVr
0BaXQp1WvOIU0ZLXqc3OwlMvOtVO1ILHC6HKcwIDAQABAoIBACLnWA0Cm73yjTj9
zpItqKZb96bpJ4xsclLZRT0udOO/eqUra+xRqtbcdnzk+n4ii3ag3vcffRX2XNPJ
npwMTM9EfIg+AKvxH4GA06IH6Gd9+5tH6Lw7pPZiJghid5kq0u2VfnJ1cz7z2r7S
EbhtnCiQq4NCZ1eMBsDuyZDtYkxwkS0IPnZFiewJ6lDGttKwV8j27aXOP0AUisH1
OJqemqtEIvro9aAh8efQNCmj6bNL3XbjjTbZ9gsAZqxsqUDtiWm1DpnmYheGyBAw
Kq+zj910DkwjO2z2ZeanoAK0NX3fxrJDHV+qKC3TrAPPBKNlBuyCPgyVTCx9fTCv
jWo9bOECgYEA3Sx9eVpUwIKqzZPblN4Y4nS71JNeGGCr1oMp4+LR6j7o7Kcf5dMk
IJHpRleuW3cfsqV2IqMSEmK/FWJ/vdRasfq8XrhODbRbVpn5t8zrO8i0RrObx3rb
X9Y9OVesbIe3D3JNKwRloEwk+8il9tvK+37LYt+AcqTjDYEtkL38jlkCgYEA0wmB
6AYfCAvY/3bde7ZLxQRrDdCeGPdhAarQ1dsfKZN7sAkfzzOzgOs/megdWQ3WMRKH
E+Wt4UexpttP+HUtuy/2xveNmZ30dZMsU2jDDkVYVaa7C6FF+hFEPDSuBbgOXXpt
ATK0b80NHD1tM759f3+VnG7Qb5T5R+7ifmCvvasCgYAR9DKbT0Hh/rluxrnkc8MB
XwiAURYqVG6ekzcrUJZJtaGi1E46kdE086NEGooE0r63+caFOUeWRn3Mdpp4Bmz2
VaxE5CEx65oehZFH4lKWH8zCkIHsx4RXW0TNCtjsVnf9wQGSpGC7inLWHYubZmwr
zjckZ5A9vjTQO9Q/E60UwQKBgD6W6kVTU27CfMg/i66+QTicd9ewEMOc0tN4wtk6
VMKy8BMkkZ+VWN6aZtGRquqXlPgW46L+EpTm+4ReNRieQELtFcaq8v8lfrREQvg1
8OvRm0JD4eOwIB3rcw5cHWSq0u/ceGnLjQI/kWzXtwSKsZPX1hqALyd4ynoQGnKa
4GRjAoGBAK68Welg0RE5IIKlfr2zz7qc/7SIN3cjELnMOd4Qc+S1C3jqPjeBdPAT
Hur8/B/l0lqFdjoK9lmUJBuhJVdVbJe1QT1WuvjrehrqLwNXklpaYUGkor4EFoFV
HtdfahLh2whSy2528Kgld4+QDG48hZpMNprM3ZsGPqBH2VUlV1cv
-----END RSA PRIVATE KEY-----`

let pub =`ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC2U+I3T42+bLNPHEWz72hE+y9Gk55VX8FNPqUVvtQC3TzxOmvQcr1zMR8qY/i3vzoDwuY/tqDR/v7xJ4MTCTMgObN0pTeADplA72ngz9pxVjZ3UWp5yMSU2yg/1jXci31que4f1F5HZhmZ/fh12FhGdGQlVtsGedLNYu7lFbxf4vNgLt9oc3X9ZE2Q7TYnQC4Mxot7CmAT7zFb+LzCNei5Wit2a4w9O6gN6hG1ICCRUSfi8Rg4gDmiKkAIgAty7iGnOFtUoJoEA/bsjSWxTIAGs65anX+TftLDgHPXSNx6kC4o9WvQFpdCnVa84hTRktepzc7CUy861U7UgscLocpz hugo@hugobox`
*/

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

