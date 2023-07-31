"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class JWTKeysIsNotSetOrInvalidError extends Error {
  constructor() {
    super("OAuth2 jwt keys is not set.");
  }
}
var _default = JWTKeysIsNotSetOrInvalidError;
exports.default = _default;