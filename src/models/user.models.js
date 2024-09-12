import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true     //to enable searching field
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true     //to enable searching field
    },
    avatar:{
        type: String,      //cloudinary url
        required: true,
    },
    coverImage:{
        type: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true, 'Password is required']
    },
    refreshtoken:{
        type: String,
    }
},{timestamps: true})

//hooks
//jab v password save hora hoga usme se ek password field ko lo usko encrypt karke save kar do
//har bar encrypt ni krna , jab v password field bhejun tabhi encrypt krna(either first time or when modification)
userSchema.pre("save", async function(next) {
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10)       //(kya encrypt krna h, or kitne round krna h)
        next()
    }    
})

//method to check password
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)        //return true or false
}

//access token generate hota h or return kiya jata h
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,      //db m store h to waha se mil jayega
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,      //db m store h to waha se mil jayega
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)