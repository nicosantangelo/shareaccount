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
    encrypt(publicKey, plainText) {
      return sjcl.encrypt(decodePublicKey(publicKey), plainText) // use all defaults
    },

    decrypt(privateKey, cipherText) {
      return sjcl.decrypt(decodePrivateKey(privateKey), cipherText) // use all defaults
    },

    createKeys: function() {
      const pair = scheme.generateKeys(curve)

      return {
        privateKey: encodePrivateKey(pair.sec.get()),
        publicKey : encodePublicKey(pair.pub.get())
      }
    }
  }


  function encodePublicKey(pub) {
    return codec.fromBits(pub.x.concat(pub.y))
  }

  function decodePublicKey(text) {
    return new scheme.publicKey(curve, codec.toBits(text))
  }

  function encodePrivateKey(sec) {
    return codec.fromBits(sec)
  }

  function decodePrivateKey(text) {
    return new scheme.secretKey(curve, curve.field.fromBits(codec.toBits(text)))
  }


  window.cryptography = cryptography
})()
