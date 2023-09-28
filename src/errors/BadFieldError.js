class BadFieldError extends Error {
    constructor({ message, field }) {
        super(message)
        this.field = field
    }
}

module.exports = BadFieldError