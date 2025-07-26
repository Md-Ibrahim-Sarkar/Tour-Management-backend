/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookie";
import { JwtPayload } from "jsonwebtoken";
import { createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import passport from "passport";
import { StatusCodes } from "http-status-codes";


const credentialLogin = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
      
  //  const loginInfo = await AuthServices.credentialLogin(req.body)

  passport.authenticate("local", async (err: any, user: any, info: any) => {
    
    if (err) {
      return next(err)
    }
    if (!user) {
      return next(new AppError(StatusCodes.NOT_FOUND, info.message));
    }

    const userTokens = await createUserTokens(user)

    const {password: past, ...rest} = user.toObject()
    
    setAuthCookie(res, userTokens)
  
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Login Successfully!',
      data: {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        ...rest
      },
    });
  })(req, res, next)

  }
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError(StatusCodes.NOT_FOUND,'no RefreshToken Received')
    }
    const loginInfo = await AuthServices.getNewAccessToken(refreshToken)

    setAuthCookie(res, loginInfo)

    sendResponse(res, {
      success: true,
      statusCode:StatusCodes.OK,
      message: 'User Login Successfully!',
      data: loginInfo,
    });
  }
);


const changePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const decodedUser = req.user;

    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const setPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
   
    const decodedUser = req.user as JwtPayload;
    const plainPassword = req.body.password;
    await AuthServices.setPassword(decodedUser.userId, plainPassword);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;
    
    await AuthServices.forgotPassword(email);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Email Send Successfully!',
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedUser = req.user;

    await AuthServices.resetPassword(
      req.body,
      decodedUser as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Password Changed Successfully!',
      data: null,
    });
  }
);


const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    
    let redirectTo = req.query.state ? (req.query.state as string) : '';

    if (redirectTo.startsWith('/')) {
      redirectTo = redirectTo.slice(1);
    }
    const user = req.user;

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User Not Found")
    }

    const tokenInfo = createUserTokens(user)

    setAuthCookie(res, tokenInfo)


    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`)
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
   
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    })

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User LogOut Successfully!',
      data: null,
    });
  }
);




export const AuthController = {
  credentialLogin,
  getNewAccessToken,
  logout,
  resetPassword,
  googleCallbackController,
  changePassword,
  setPassword,
  forgotPassword,
};