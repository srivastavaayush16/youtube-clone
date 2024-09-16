import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiReponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) =>{
    // res.status(200).json({
    //     message: "ok"
    // })

    //get user details from frontend
    //validation-not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    //console.log(req.body)
    const {fullname, email, username, password} = req.body
    // console.log("email: ", email);

    // if(fullname === ""){
    //     throw new ApiError(400, "fullname s required")
    // }
    //another method for writing if else(aggar bahut sara if else ho to)
    if(
        [fullname, email, username, password].some((field)=>            //map v laga skte ho
        field?.trim() === "")           //trim krne k bad v empty h to true return karega,        //returns true or false
    ){
        throw new ApiError(400, "All fields are required")
    }

    // ye return karea ek document jo us username ya email se match hora hoga
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;           //modern way
    //classic way to check
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while regestering the user")
    }
     
    return res.status(201).json(
        new ApiReponse(200, createdUser, "user registered successfully")
    )
})

export {registerUser}