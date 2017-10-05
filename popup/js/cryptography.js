/* global sjcl */

(function() {
  'use strict'

  // Thin wrapper around Standford Javascript Crypto Lib to provide a more generic interface.

  // We'll serialize/deserialize binary objects using HEX:
  const codec = sjcl.codec.hex

  // We'll use elliptic curves for asymmetric cryptography, with the k256 curve:
  const curve = sjcl.ecc.curves.k256

  const scheme = sjcl.ecc.elGamal


  const cryptography = {
    encrypt: function(secret, plainText, options={}) {
      return sjcl.encrypt(secret, plainText, options) // use all defaults
    },

    decrypt: function(secret, cipherText, options={}) {
      return sjcl.decrypt(secret, cipherText, options) // use all defaults
    },

    createKeys: function() {
      const pair = scheme.generateKeys(curve)

      return {
        privateKey: encodePrivateKey(pair.sec.get()),
        publicKey : encodePublicKey(pair.pub.get())
      }
    },

    randomkey: function() {
      return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 0), 0)
    },

    decodePublicKey: function(text) {
      return new scheme.publicKey(curve, codec.toBits(text))
    },

    decodePrivateKey: function(text) {
      return new scheme.secretKey(curve, curve.field.fromBits(codec.toBits(text)))
    }
  }

  function encodePublicKey(pub) {
    return codec.fromBits(pub.x.concat(pub.y))
  }

  function encodePrivateKey(sec) {
    return codec.fromBits(sec)
  }

  window.cryptography = cryptography
})()
