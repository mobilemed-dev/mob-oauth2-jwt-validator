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
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
class TokenValidator {}
_defineProperty(TokenValidator, "issuer", null);
_defineProperty(TokenValidator, "jwks", null);
_defineProperty(TokenValidator, "setOauth", function (oAuth2Issuer) {
  if (!oAuth2Issuer || typeof oAuth2Issuer !== 'string') {
    throw new _BadFieldError.default("OAuth2 Issuer was not sent or is invalid. oAuth2Issuer must be a valid string URI.");
  }
  oAuth2Issuer = oAuth2Issuer.replace(/\/$/, '');
  TokenValidator.issuer = oAuth2Issuer;
});
_defineProperty(TokenValidator, "loadConfiguration", async function ({
  oAuth2Issuer
}) {
  if (TokenValidator.jwks) {
    return;
  }
  TokenValidator.setOauth(oAuth2Issuer);
  const url = `${TokenValidator.issuer}/.well-known/jwks.json`;
  let response = {};
  try {
    response = await _axios.default.get(url);
  } catch (error) {
    throw new _OAuthNotRespondingError.default();
  }
  if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
    TokenValidator.jwks = (0, _jwkToPem.default)(response.data.keys[response.data.keys.length - 1]);
    return;
  }
  throw new _JWTKeysIsNotSetOrInvalidError.default();
});
_defineProperty(TokenValidator, "validate", function (token) {
  if (!TokenValidator.jwks) {
    throw new _ConfigurationNotLoadedError.default();
  }
  if (!token || typeof token !== 'string') {
    throw new _InvalidTokenTypeError.default();
  }
  try {
    const decoded = (0, _jsonwebtoken.verify)(token, TokenValidator.jwks);
    return !!decoded;
  } catch (error) {
    return false;
  }
});
_defineProperty(TokenValidator, "dispose", function () {
  TokenValidator.issuer = null;
  TokenValidator.jwks = null;
});
var _default = TokenValidator;
exports.default = _default;