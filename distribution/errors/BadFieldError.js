"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class BadFieldError extends Error {
  constructor({
    message,
    field
  }) {
    super(message);
    this.field = field;
  }
}
var _default = BadFieldError;
exports.default = _default;