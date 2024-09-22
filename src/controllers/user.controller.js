import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiReponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()

        //refreshtoken ko db m save rakhte h taki bar bar password na puchna pade user se, accessToken to user ko dedete h
        //refreshToken ko db m kaise dale, object k andar jaise value dalte hain
        //saving refreshtoken into db
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while ggenerating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) =>{
    // res.status(200).json({
    //     message: "ok"
    // })

    //1.get user details from frontend
    //2.validation-not empty
    //3.check if user already exists: username, email
    //4.check for images, check for avatar
    //5.upload them to cloudinary,avatar
    //6.create user object - create entry in db
    //7.remove password and refresh token field from response
    //8.check for user creation
    //9.return res

    //1.
    //console.log(req.body)
    const {fullname, email, username, password} = req.body
    // console.log("email: ", email);

    //2.
    // if(fullname === ""){
    //     throw new ApiError(400, "fullname s required")
    // }        aise karke bahut sara if else likhna padega, isliye..
    //another method for writing if else(aggar bahut sara if else ho to)
    if(
        [fullname, email, username, password].some((field)=>            //map v laga skte ho
        field?.trim() === "")           //trim krne k bad v empty h to true return karega,        //returns true or false
    ){
        throw new ApiError(400, "All fields are required")
    }

    //3.
    // ye return karega ek document jo us username ya email se match hora hoga
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    //4.
    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;           //modern way
    //classic way to check
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //avatar to hona hi chahyiye, coverImage ho na ho
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    //5.
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    //avatar to hona hi chahyiye, coverImage ho na ho
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //6.
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //7.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //8.
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while regestering the user")
    }
     
    //9.
    return res.status(201).json(
        new ApiReponse(200, createdUser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res)=>{
    //req.body ->data
    //username or email
    //find the user
    //password check
    //create access and refresh token
    //send cookie

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username, email}]
    })

    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiReponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged In sucessfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }    
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiReponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }   
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newrefreshToken, options)
       .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
       )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid refresh token") 
    }


})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}