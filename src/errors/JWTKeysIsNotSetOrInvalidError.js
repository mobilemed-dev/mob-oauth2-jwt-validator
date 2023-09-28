class JWTKeysIsNotSetOrInvalidError extends Error {
    constructor() {
        super("OAuth2 jwt keys is not set.")
    }
}

module.exports = JWTKeysIsNotSetOrInvalidError