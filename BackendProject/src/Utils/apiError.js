
class apiError extends Error {
    constructor(
        statusCode,
        message = "something went wrongn",
        errors = [],
        stack = ""
    ) {
        super(message)
        this.statusCode = statusCode
        this.message = message
        this.errors = errors
        this.data = null
        this.success = false

        if (stack) {
            this.stack = stack
        } else {
            this.captureStackTrace(this, this.constructor)
        }

    }
}

export {apiError}