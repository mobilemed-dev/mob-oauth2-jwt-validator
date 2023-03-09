class InvalidTokenError extends Error {
    constructor() {
        super("Configuration was not loaded, or it was loaded with errors. Please call loadConfiguration before validate.")
    }
}

export default InvalidTokenError