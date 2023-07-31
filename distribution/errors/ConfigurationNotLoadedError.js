"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
class ConfigurationNotLoadedError extends Error {
  constructor() {
    super("Configuration was not loaded, or it was loaded with errors. Please call loadConfiguration before validate.");
  }
}
var _default = ConfigurationNotLoadedError;
exports.default = _default;