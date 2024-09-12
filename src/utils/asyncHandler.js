// const asyncHandler = () => {}
// const asyncHandler = (fn) = {  () => {} }
// const asyncHandler = (fn) = () => {}

//ye ek wrapper function hai jo bahut jagah use hoga
/*const asyncHandler = (fn) = async(req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
        
    }
}  */

//upar wala same function but in another way (Promise wale type se)    
const asyncHandler = (requestHandler) =>{
    Promise.resolve(requestHandler(req, res, next))
    .catch((err) => next(err))      //aga kuch error aata hai tab bhi woo aage ka kaam karne lag jayega
}

export {asyncHandler}