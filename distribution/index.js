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
class TokenValidator {
  static #issuer = null;
  static #jwks = null;
  static #setOauth(oAuth2Issuer) {
    if (!oAuth2Issuer || typeof oAuth2Issuer !== 'string') {
      throw new _BadFieldError.default("OAuth2 Issuer was not sent or is invalid. oAuth2Issuer must be a valid string URI.");
    }
    oAuth2Issuer = oAuth2Issuer.replace(/\/$/, '');
    TokenValidator.#issuer = oAuth2Issuer;
  }
  static async loadConfiguration({
    oAuth2Issuer
  }) {
    if (TokenValidator.#jwks) {
      return;
    }
    TokenValidator.#setOauth(oAuth2Issuer);
    const url = `${TokenValidator.#issuer}/.well-known/jwks.json`;
    let response = {};
    try {
      response = await _axios.default.get(url);
    } catch (error) {
      throw new _OAuthNotRespondingError.default();
    }
    if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
      TokenValidator.#jwks = (0, _jwkToPem.default)(response.data.keys[response.data.keys.length - 1]);
      return;
    }
    throw new _JWTKeysIsNotSetOrInvalidError.default();
  }
  static validate(token) {
    if (!TokenValidator.#jwks) {
      throw new _ConfigurationNotLoadedError.default();
    }
    if (!token || typeof token !== 'string') {
      throw new _InvalidTokenTypeError.default();
    }
    try {
      const decoded = (0, _jsonwebtoken.verify)(token, TokenValidator.#jwks);
      return !!decoded;
    } catch (error) {
      return false;
    }
  }
  static dispose() {
    TokenValidator.#issuer = null;
    TokenValidator.#jwks = null;
  }
}
var _default = TokenValidator;
exports.default = _default;