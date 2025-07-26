"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const division_route_1 = require("../modules/division/division.route");
const tour_route_1 = require("../modules/tour/tour.route");
const booking_route_1 = require("../modules/booking/booking.route");
const payment_route_1 = require("../modules/payment/payment.route");
exports.router = (0, express_1.Router)();
const moduleRouters = [
    {
        path: '/user',
        route: user_route_1.userRoute,
    },
    {
        path: '/auth',
        route: auth_route_1.authRouter,
    },
    {
        path: '/division',
        route: division_route_1.DivisionRoutes,
    },
    {
        path: '/tour',
        route: tour_route_1.TourRoutes,
    },
    {
        path: '/booking',
        route: booking_route_1.BookingRoutes,
    },
    {
        path: '/payment',
        route: payment_route_1.PaymentRoutes,
    },
];
moduleRouters.forEach(route => {
    exports.router.use(route.path, route.route);
});
