class OAuthNotRespondingError extends Error {
    constructor() {
        super("OAuth2 Issuer is invalid or offline.")
    }
}

module.exports = OAuthNotRespondingError