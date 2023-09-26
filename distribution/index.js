"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TokenValidator = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
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
const {
  verify
} = _jsonwebtoken.default;
class TokenValidator {
  static validatePoolsConfiguration(poolsConfiguration) {
    if (!poolsConfiguration.poolId) return false;
    if (!poolsConfiguration.tenant) return false;
    if (poolsConfiguration.clientId !== undefined && !Array.isArray(poolsConfiguration.clientId) && typeof poolsConfiguration.clientId !== 'string') return false;
    return true;
  }
  static mapToken(token) {
    const info = token.split('.')[1];
    const base64 = info.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('binary');
    const json = JSON.parse(decoded);
    json.poolId = json.iss.split('/')[3];
    return json;
  }
}
exports.TokenValidator = TokenValidator;
_defineProperty(TokenValidator, "jwks", {});
_defineProperty(TokenValidator, "poolsConfiguration", {});
_defineProperty(TokenValidator, "oAuth2IssuerBaseUrl", "");
_defineProperty(TokenValidator, "getJwks", async function (oAuth2IssuerBaseUrl, poolConfiguration) {
  if (TokenValidator.jwks[poolConfiguration.poolId]) {
    return TokenValidator.jwks[poolConfiguration.poolId];
  }
  const issuer = `${oAuth2IssuerBaseUrl}/${poolConfiguration.poolId}/${poolConfiguration.tenant}`;
  const url = `${issuer}/.well-known/jwks.json`;
  let response = {};
  try {
    response = await _axios.default.get(url);
  } catch (error) {
    throw new _OAuthNotRespondingError.default();
  }
  if (response.data && response.data.keys && Array.isArray(response.data.keys) && response.data.keys.length) {
    TokenValidator.jwks[poolConfiguration.poolId] = (0, _jwkToPem.default)(response.data.keys[response.data.keys.length - 1]);
    return TokenValidator.jwks[poolConfiguration.poolId];
  }
  throw new _JWTKeysIsNotSetOrInvalidError.default();
});
_defineProperty(TokenValidator, "loadConfiguration", async function ({
  oAuth2IssuerBaseUrl,
  poolsConfiguration
}) {
  if (!oAuth2IssuerBaseUrl || typeof oAuth2IssuerBaseUrl !== 'string') {
    throw new _BadFieldError.default("OAuth2 Issuer was not sent or is invalid. oAuth2IssuerBaseUrl must be a valid string URI.");
  }
  if (!poolsConfiguration || !Array.isArray(poolsConfiguration) || poolsConfiguration.length === 0) {
    throw new _BadFieldError.default("poolsConfiguration was not sent or is invalid. poolsConfiguration must be a valid array.");
  }
  const isInvalid = poolsConfiguration.some(poolConfiguration => {
    TokenValidator.validatePoolsConfiguration(poolConfiguration);
  });
  if (isInvalid) {
    throw new _BadFieldError.default("poolsConfiguration was not sent or is invalid. poolsConfiguration must be a valid array.");
  }
  poolsConfiguration.forEach(poolConfiguration => {
    TokenValidator.poolsConfiguration[poolConfiguration.poolId] = poolConfiguration;
  });
  TokenValidator.oAuth2IssuerBaseUrl = oAuth2IssuerBaseUrl;
});
_defineProperty(TokenValidator, "validate", async function (token) {
  if (!token || typeof token !== 'string') {
    throw new _InvalidTokenTypeError.default();
  }
  // get information from token using base64
  const tokenDecoded = TokenValidator.mapToken(token);

  //get user pool from iss
  if (!tokenDecoded.poolId) {
    throw new _InvalidTokenTypeError.default();
  }
  const tokenConfiguration = TokenValidator.poolsConfiguration[tokenDecoded.poolId];
  if (!tokenConfiguration) {
    throw new _ConfigurationNotLoadedError.default();
  }
  if (tokenConfiguration.clientId && !tokenConfiguration.clientId.includes(tokenDecoded.client_id)) {
    return false;
  }
  const jwks = await TokenValidator.getJwks(TokenValidator.oAuth2IssuerBaseUrl, tokenConfiguration);
  if (!jwks) {
    throw new _JWTKeysIsNotSetOrInvalidError.default();
  }
  try {
    const decoded = verify(token, jwks);
    return !!decoded;
  } catch (error) {
    return false;
  }
});
_defineProperty(TokenValidator, "dispose", function () {
  TokenValidator.jwks = {};
  TokenValidator.poolsConfiguration = {};
  TokenValidator.oAuth2IssuerBaseUrl = "";
});
var _default = TokenValidator;
exports.default = _default;