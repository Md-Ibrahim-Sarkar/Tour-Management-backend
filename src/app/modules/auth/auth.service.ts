/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import bcryptjs from 'bcryptjs';
import { IAuthProvider, IsActive, IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import AppError from '../../errorHelpers/AppError';
import { generateToken, verifyToken } from '../../utils/jwt';
import { envVars } from '../../config/env';
import {
  createNewAccessTokenWithRefresh,
  createUserTokens,
} from '../../utils/userTokens';
import { JwtPayload } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendEmail';

const credentialLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email dose not Exist');
  }

  const isPasswordMatched = await bcryptjs.compare(
    password as string,
    isUserExist.password as string
  );

  if (!isPasswordMatched) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Incorrect Password');
  }

  const userTokens = createUserTokens(isUserExist);

  const { password: past, ...rest } = isUserExist.toObject();

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: rest,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const accessToken = await createNewAccessTokenWithRefresh(refreshToken);
  return {
    accessToken: accessToken,
  };
};



const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedUser: JwtPayload
) => {
  const user = await User.findById(decodedUser.userId);

  const isOldPassword = await bcryptjs.compare(
    oldPassword,
    user?.password as string
  );

  if (!isOldPassword) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Old Password does not match');
  }

  user!.password = await bcryptjs.hash(newPassword, envVars.BCRYPT_SALT_ROUND);

  user!.save();
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (user.password && user.auths[0].provider !== 'email') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'User already has a password set'
    );
  }

  user.password = await bcryptjs.hash(plainPassword, envVars.BCRYPT_SALT_ROUND);
  user.isActive = IsActive.ACTIVE;

  const credentialProvider: IAuthProvider = {
    provider: 'email',
    providerId: user.email,
  };

  const auths: IAuthProvider[] = [...user.auths, credentialProvider];
  user.auths = auths;

  await user.save();

  return {
    user: user.toObject(),
  };
};

const forgotPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User does not exist');
  }
  if (!isUserExist.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is not verified');
  }
  if (
    isUserExist.isActive === IsActive.BLOCKED ||
    isUserExist.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.isActive}`
    );
  }
  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'User is deleted');
  }

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
  });


  const resetLink = `${envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: 'Password Reset Request',
    templateName: 'forgetPassword',
    templateData: {
      name: isUserExist.name,
      resetLink: resetLink,
    }
  })

  // Here you would typically send an email with a reset link
  // For now, we just simulate this action
  console.log(`Password reset link sent to ${email}`);

  return {
    message: 'Password reset link sent successfully',
  };
};

const resetPassword = async (
  payload: Record<string, any>,
  decodedUser: JwtPayload
) => {


   if (payload.id != decodedUser.userId) {
     throw new AppError(401, 'You can not reset your password');
   }

  const isUserExist = await User.findById(decodedUser.userId);

   if (!isUserExist) {
     throw new AppError(401, 'User does not exist');
   }

  const hashedPassword = await bcryptjs.hash(
    payload.newPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  isUserExist.password = hashedPassword;
  isUserExist.isActive = IsActive.ACTIVE;
  isUserExist.isVerified = true;

  await isUserExist!.save();
};

export const AuthServices = {
  credentialLogin,
  getNewAccessToken,
  resetPassword,
  changePassword,
  setPassword,
  forgotPassword,
};
