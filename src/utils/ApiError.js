// ye file isliye banai h kyunki jitne v errors aayyenge wo ek particular format m aayenge
// kyunki sab errors alag alag type se aatte hain to error padhne m dikatt aayegii, isliye agar error ek particular format m aayegga to sahi rahega

class ApiError extends Error{
    constructor(
        statuCode,
        message = "Something went wrong",
        errors=[],
        statck=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if(statck){
            this.stack = statck
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}

