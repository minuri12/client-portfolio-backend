export const sendSuccessResponse = (res,statusCode,message,data) => {
    res.status(statusCode).json({
        status: "success",
        message,
        data,
        timeStamp: new Date().toISOString()
    })
}


export const sendErrorResponse = (res,statusCode,message,error) => {
    res.status(statusCode).json({
        status: "fail",
        message,
        error: error?.message || error,
        timeStamp: new Date().toISOString()
    })
}