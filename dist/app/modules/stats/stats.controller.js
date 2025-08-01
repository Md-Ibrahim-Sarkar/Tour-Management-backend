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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const stats_service_1 = require("./stats.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const getBookingStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield stats_service_1.StatsService.getBookingStats();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Booking stats fetched successfully',
        data: stats,
    });
}));
const getPaymentStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield stats_service_1.StatsService.getPaymentStats();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payment stats fetched successfully',
        data: stats,
    });
}));
const getUserStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield stats_service_1.StatsService.getUserStats();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User stats fetched successfully',
        data: stats,
    });
}));
const getTourStats = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield stats_service_1.StatsService.getTourStats();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Tour stats fetched successfully',
        data: stats,
    });
}));
exports.StatsController = {
    getBookingStats,
    getPaymentStats,
    getUserStats,
    getTourStats,
};
