"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class OAuthNotRespondingError extends Error {
  constructor() {
    super("OAuth2 Issuer is invalid or offline.");
  }
}
var _default = OAuthNotRespondingError;
exports.default = _default;