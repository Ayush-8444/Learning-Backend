
class apiResponse {
    constructor(
        statusCode,
        messsage = "success",
        data,
    ) {
        this.statusCode = statusCode
        this.messsage = messsage
        this.data = data
        this.success = statusCode < 400
    }
}

export {apiResponse}