import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import { IsActive, IUser } from "../modules/user/user.interface";
import { generateToken, verifyToken } from "./jwt";
import { User } from "../modules/user/user.model";
import AppError from "../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";

export const createUserTokens = (user: Partial<IUser>) => {
  const isPayload = {
    userId: user._id,
    email: user.email,
    role: user.role
  }
  const accessToken = generateToken(isPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)
  const refreshToken = generateToken(isPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)
  
  return {
    accessToken,
    refreshToken
  }
}

export const createNewAccessTokenWithRefresh = async  (refreshToken: string) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET
  ) as JwtPayload;

  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User dose not Exist');
  }

  if (isUserExist.isActive === IsActive.BLOCKED) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is blocked');
  }

  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is Deleted');
  }
  const isPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const accessToken = generateToken(
    isPayload,
    envVars.JWT_ACCESS_SECRET,
    envVars.JWT_ACCESS_EXPIRES
  );

  return accessToken
};