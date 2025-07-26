/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import { serviceUser } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { JwtPayload, verify } from 'jsonwebtoken';
import { verifyToken } from '../../utils/jwt';
import { envVars } from '../../config/env';
import { StatusCodes } from 'http-status-codes';

const createUser = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const user = await serviceUser.createUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User Created Successfully!',
    data: user,
  });
  }
);


const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id
  const payload = req.body
  const decodedToken = req.user;
    const user = await serviceUser.updateUser(userId, payload, decodedToken as JwtPayload);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'User Updated Successfully!',
      data: user,
    });
  }
);

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const result = await serviceUser.getAllUser();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All Users Retrieved Successfully',
    meta: result.meta,
    data: result.data,
  });
})

export const userController = { createUser, getAllUsers, updateUser };
