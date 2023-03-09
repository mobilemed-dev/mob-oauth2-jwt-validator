class JWTKeysIsNotSetOrInvalidError extends Error {
    constructor() {
        super("OAuth2 jwt keys is not set.")
    }
}

export default JWTKeysIsNotSetOrInvalidError