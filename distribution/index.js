"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _jsonwebtoken = require("jsonwebtoken");
var _jwkToPem = _interopRequireDefault(require("jwk-to-pem"));
var _BadFieldError = _interopRequireDefault(require("./errors/BadFieldError.js"));
var _OAuthNotRespondingError = _interopRequireDefault(require("./errors/OAuthNotRespondingError.js"));
var _JWTKeysIsNotSetOrInvalidError = _interopRequireDefault(require("./errors/JWTKeysIsNotSetOrInvalidError.js"));
var _ConfigurationNotLoadedError = _interopRequireDefault(require("./errors/ConfigurationNotLoadedError.js"));
var _InvalidTokenTypeError = _interopRequireDefault(require("./errors/InvalidTokenTypeError.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classStaticPrivateMethodGet(receiver, classConstructor, method) { _classCheckPrivateStaticAccess(receiver, classConstructor); return method; }
function _classStaticPrivateFieldSpecGet(receiver, classConstructor, descriptor) { _classCheckPrivateStaticAccess(receiver, classConstructor); _classCheckPrivateStaticFieldDescriptor(descriptor, "get"); return _classApplyDescriptorGet(receiver, descriptor); }
function _classApplyDescriptorGet(receiver, descriptor) { if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }
function _classStaticPrivateFieldSpecSet(receiver, classConstructor, descriptor, value) { _classCheckPrivateStaticAccess(receiver, classConstructor); _classCheckPrivateStaticFieldDescriptor(descriptor, "set"); _classApplyDescriptorSet(receiver, descriptor, value); return value; }
function _classCheckPrivateStaticFieldDescriptor(descriptor, action) { if (descriptor === undefined) { throw new TypeError("attempted to " + action + " private static field before its declaration"); } }
function _classCheckPrivateStaticAccess(receiver, classConstructor) { if (receiver !== classConstructor) { throw new TypeError("Private static access of wrong provenance"); } }
function _classApplyDescriptorSet(receiver, descriptor, value) { if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } }
class TokenValidator {
  static async loadConfiguration({
    oAuth2Issuer
  }) {
    if (_classStaticPrivateFieldSpecGet(TokenValidator, TokenValidator, _jwks)) {
      return;
    }
    _classStaticPrivateMethodGet(TokenValidator, TokenValidator, _setOauth).call(TokenValidator, oAuth2Issuer);
    const url = `${_classStaticPrivateFieldSpecGet(TokenValidator, TokenValidator, _issuer)}/.well-known/jwks.json`;
    let response = {};
    try {
      response = await _axios.default.get(url);
    } catch (error) {
      throw new _OAuthNotRespondingError.default();
    }
    if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
      _classStaticPrivateFieldSpecSet(TokenValidator, TokenValidator, _jwks, (0, _jwkToPem.default)(response.data.keys[response.data.keys.length - 1]));
      return;
    }
    throw new _JWTKeysIsNotSetOrInvalidError.default();
  }
  static validate(token) {
    if (!_classStaticPrivateFieldSpecGet(TokenValidator, TokenValidator, _jwks)) {
      throw new _ConfigurationNotLoadedError.default();
    }
    if (!token || typeof token !== 'string') {
      throw new _InvalidTokenTypeError.default();
    }
    try {
      const decoded = (0, _jsonwebtoken.verify)(token, _classStaticPrivateFieldSpecGet(TokenValidator, TokenValidator, _jwks));
      return !!decoded;
    } catch (error) {
      return false;
    }
  }
  static dispose() {
    _classStaticPrivateFieldSpecSet(TokenValidator, TokenValidator, _issuer, null);
    _classStaticPrivateFieldSpecSet(TokenValidator, TokenValidator, _jwks, null);
  }
}
function _setOauth(oAuth2Issuer) {
  if (!oAuth2Issuer || typeof oAuth2Issuer !== 'string') {
    throw new _BadFieldError.default("OAuth2 Issuer was not sent or is invalid. oAuth2Issuer must be a valid string URI.");
  }
  oAuth2Issuer = oAuth2Issuer.replace(/\/$/, '');
  _classStaticPrivateFieldSpecSet(TokenValidator, TokenValidator, _issuer, oAuth2Issuer);
}
var _issuer = {
  writable: true,
  value: null
};
var _jwks = {
  writable: true,
  value: null
};
var _default = TokenValidator;
exports.default = _default;