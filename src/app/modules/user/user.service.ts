import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import bcryptjs from "bcryptjs"
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";



const createUser = async (payload: Partial<IUser>) => {
  const { email,password, ...rest } = payload;
  
  const isUserExist = await User.findOne({ email })
  

  if (isUserExist) {
    throw new Error(`Status ${StatusCodes.BAD_REQUEST}: User Already Exist`)
  }

  const authProvider: IAuthProvider = { provider: "Email", providerId: email as string }
  
  const isHashPassword = await bcryptjs.hash(password as string, envVars.BCRYPT_SALT_ROUND)

  const user = User.create({ email, auths: [authProvider],password: isHashPassword, ...rest })
  
  

  return user
}


const updateUser = async (userId: string, payload: Partial<IUser>, decodedToken: JwtPayload) => {

  const ifUserExist = await User.findById(userId)

  if (!ifUserExist) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User Not Found')
  }

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
      throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized")
    }
    
    if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
       throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
    }

    if (payload.isActive || payload.isDeleted || payload.isVerified) {
       if (
         decodedToken.role === Role.USER ||
         decodedToken.role === Role.GUIDE
       ) {
         throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized');
       }
    }

    if (payload.password) {
      payload.password = await bcryptjs.hash(payload.password, envVars.BCRYPT_SALT_ROUND)
    }

    const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {new: true,runValidators: true})
  
    return newUpdatedUser
  }
}

const getAllUser = async () => {
  const users = await User.find({})
  const totalUser = await User.countDocuments()
  return {
    data: users,
    meta: {
      total: totalUser
    }
  }
}

export const serviceUser = {
  createUser,
  getAllUser,
  updateUser,
};