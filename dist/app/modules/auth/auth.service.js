"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const env_1 = require("../../config/env");
const userTokens_1 = require("../../utils/userTokens");
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendEmail_1 = require("../../utils/sendEmail");
const credentialLogin = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email dose not Exist');
    }
    const isPasswordMatched = yield bcryptjs_1.default.compare(password, isUserExist.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Incorrect Password');
    }
    const userTokens = (0, userTokens_1.createUserTokens)(isUserExist);
    const _a = isUserExist.toObject(), { password: past } = _a, rest = __rest(_a, ["password"]);
    return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        user: rest,
    };
});
const getNewAccessToken = (refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = yield (0, userTokens_1.createNewAccessTokenWithRefresh)(refreshToken);
    return {
        accessToken: accessToken,
    };
});
const changePassword = (oldPassword, newPassword, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(decodedUser.userId);
    const isOldPassword = yield bcryptjs_1.default.compare(oldPassword, user === null || user === void 0 ? void 0 : user.password);
    if (!isOldPassword) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Old Password does not match');
    }
    user.password = yield bcryptjs_1.default.hash(newPassword, env_1.envVars.BCRYPT_SALT_ROUND);
    user.save();
});
const setPassword = (userId, plainPassword) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.password && user.auths[0].provider !== 'email') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User already has a password set');
    }
    user.password = yield bcryptjs_1.default.hash(plainPassword, env_1.envVars.BCRYPT_SALT_ROUND);
    user.isActive = user_interface_1.IsActive.ACTIVE;
    const credentialProvider = {
        provider: 'email',
        providerId: user.email,
    };
    const auths = [...user.auths, credentialProvider];
    user.auths = auths;
    yield user.save();
    return {
        user: user.toObject(),
    };
});
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isUserExist = yield user_model_1.User.findOne({ email });
    if (!isUserExist) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User does not exist');
    }
    if (!isUserExist.isVerified) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is not verified');
    }
    if (isUserExist.isActive === user_interface_1.IsActive.BLOCKED ||
        isUserExist.isActive === user_interface_1.IsActive.INACTIVE) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `User is ${isUserExist.isActive}`);
    }
    if (isUserExist.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is deleted');
    }
    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
    };
    const resetToken = jsonwebtoken_1.default.sign(jwtPayload, env_1.envVars.JWT_ACCESS_SECRET, {
        expiresIn: '10m',
    });
    const resetLink = `${env_1.envVars.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;
    (0, sendEmail_1.sendEmail)({
        to: isUserExist.email,
        subject: 'Password Reset Request',
        templateName: 'forgetPassword',
        templateData: {
            name: isUserExist.name,
            resetLink: resetLink,
        }
    });
    // Here you would typically send an email with a reset link
    // For now, we just simulate this action
    console.log(`Password reset link sent to ${email}`);
    return {
        message: 'Password reset link sent successfully',
    };
});
const resetPassword = (payload, decodedUser) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.id != decodedUser.userId) {
        throw new AppError_1.default(401, 'You can not reset your password');
    }
    const isUserExist = yield user_model_1.User.findById(decodedUser.userId);
    if (!isUserExist) {
        throw new AppError_1.default(401, 'User does not exist');
    }
    const hashedPassword = yield bcryptjs_1.default.hash(payload.newPassword, Number(env_1.envVars.BCRYPT_SALT_ROUND));
    isUserExist.password = hashedPassword;
    isUserExist.isActive = user_interface_1.IsActive.ACTIVE;
    isUserExist.isVerified = true;
    yield isUserExist.save();
});
exports.AuthServices = {
    credentialLogin,
    getNewAccessToken,
    resetPassword,
    changePassword,
    setPassword,
    forgotPassword,
};
