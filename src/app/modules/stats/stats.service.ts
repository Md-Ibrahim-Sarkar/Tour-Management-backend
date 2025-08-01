/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from '../booking/booking.model';
import { PAYMENT_STATUS } from '../payment/payment.interface';
import { Payment } from '../payment/payment.model';
import { Tour } from '../tour/tour.model';
import { IsActive } from '../user/user.interface';
import { User } from '../user/user.model';

const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);


const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();

  const activeUsersPromise = User.countDocuments({ isActive: IsActive.ACTIVE });
  const inActiveUsersPromise = User.countDocuments({ isActive: IsActive.INACTIVE });
  const blockedUsersPromise = User.countDocuments({ isActive: IsActive.BLOCKED });

  const newUsersLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  })
  const newUsersLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1}
       }
     }
  ])

  const [
    totalUsers,
    activeUsers,
    inActiveUsers,
    blockedUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    usersByRole
  ] = await Promise.all([
    totalUsersPromise,
    activeUsersPromise,
    inActiveUsersPromise,
    blockedUsersPromise,
    newUsersLast7DaysPromise,
    newUsersLast30DaysPromise,
    usersByRolePromise

  ])

  return {
    totalUsers,
    activeUsers,
    inActiveUsers,
    blockedUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    usersByRole: usersByRole.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  };
};

const getTourStats = async () => {
  
  const totalToursPromise = Tour.countDocuments();
   
  const totalTourByTourTypePromise = Tour.aggregate([
    {
      $lookup: {
        from: 'tourtypes',
        localField: 'tourType',
        foreignField: "_id",
        as: "type"
      },
    },
    {
      $unwind: "$type"
    },
    {
      $group: {
        _id: "$type.name",
        count: {$sum: 1}
      }
    }
  ]);

  const avgTourCostPromise = Tour.aggregate([
    {
      $group: {
        _id: null,
        avgCostFrom: { $avg: '$costFrom' },
      },
    },
  ]);

  const totalTourByDivisionPromise = Tour.aggregate([
    {
      $lookup: {
        from: 'divisions',
        localField: 'division',
        foreignField: '_id',
        as: 'division',
      },
    },
    {
      $unwind: '$division',
    },
    {
      $group: {
        _id: '$division.name',
        count: { $sum: 1 },
      },
    },
  ]);


  const totalHighestBookedTourPromise = Tour.aggregate([
    {
      $group: {
        _id: '$tour',
        bookingCount: { $sum: 1 },
      },
    },

    //stage-2 : sort the tour

    {
      $sort: { bookingCount: -1 },
    },

    //stage-3 : sort
    {
      $limit: 5,
    },

    //stage-4 lookup stage
    {
      $lookup: {
        from: 'tours',
        let: { tourId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$tourId'] },
            },
          },
        ],
        as: 'tour',
      },
    },
   
  ]);

  const [
    totalTours,
    totalTourByTourType,
    avgCostFrom,
    totalTourByDivision,
    totalHighestBookedTour,
  ] = await Promise.all([
    totalToursPromise,
    totalTourByTourTypePromise,
    avgTourCostPromise,
    totalTourByDivisionPromise,
    totalHighestBookedTourPromise,
  ]);


  return {
    totalTours,
    totalTourByTourType,
    avgCostFrom,
    totalTourByDivision,
    totalHighestBookedTour
  };
};

const getBookingStats = async () => {
     const totalBookingPromise = Booking.countDocuments();

     const totalBookingByStatusPromise = Booking.aggregate([
       //stage-1 group stage
       {
         $group: {
           _id: '$status',
           count: { $sum: 1 },
         },
       },
     ]);

     const bookingsPerTourPromise = Booking.aggregate([
       //stage1 group stage

       {
         $group: {
           _id: '$tour',
           bookingCount: { $sum: 1 },
         },
       },

       //stage-2 sort stage
       {
         $sort: { bookingCount: -1 },
       },

       //stage-3 limit stage
       {
         $limit: 10,
       },

       //stage-4 lookup stage
       {
         $lookup: {
           from: 'tours',
           localField: '_id',
           foreignField: '_id',
           as: 'tour',
         },
       },

       // stage5 - unwind stage
       {
         $unwind: '$tour',
       },

       // stage6 project stage

       {
         $project: {
           bookingCount: 1,
           _id: 1,
           'tour.title': 1,
           'tour.slug': 1,
         },
       },
     ]);

     const avgGuestCountPerBookingPromise = Booking.aggregate([
       // stage 1  - group stage
       {
         $group: {
           _id: null,
           avgGuestCount: { $avg: '$guestCount' },
         },
       },
     ]);

     const bookingsLast7DaysPromise = Booking.countDocuments({
       createdAt: { $gte: sevenDaysAgo },
     });
     const bookingsLast30DaysPromise = Booking.countDocuments({
       createdAt: { $gte: thirtyDaysAgo },
     });

     const totalBookingByUniqueUsersPromise = Booking.distinct('user').then(
       (user: any) => user.length
     );

     const [
       totalBooking,
       totalBookingByStatus,
       bookingsPerTour,
       avgGuestCountPerBooking,
       bookingsLast7Days,
       bookingsLast30Days,
       totalBookingByUniqueUsers,
     ] = await Promise.all([
       totalBookingPromise,
       totalBookingByStatusPromise,
       bookingsPerTourPromise,
       avgGuestCountPerBookingPromise,
       bookingsLast7DaysPromise,
       bookingsLast30DaysPromise,
       totalBookingByStatusPromise,
       totalBookingByUniqueUsersPromise,
     ]);

     return {
       totalBooking,
       totalBookingByStatus,
       bookingsPerTour,
       avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount,
       bookingsLast7Days,
       bookingsLast30Days,
       totalBookingByUniqueUsers,
     };
};

const getPaymentStats = async () => {
   const totalPaymentPromise = Payment.countDocuments();

   const totalPaymentByStatusPromise = Payment.aggregate([
     //stage 1 group
     {
       $group: {
         _id: '$status',
         count: { $sum: 1 },
       },
     },
   ]);

   const totalRevenuePromise = Payment.aggregate([
     //stage1 match stage
     {
       $match: { status: PAYMENT_STATUS.PAID },
     },
     {
       $group: {
         _id: null,
         totalRevenue: { $sum: '$amount' },
       },
     },
   ]);

   const avgPaymentAmountPromise = Payment.aggregate([
     //stage 1 group stage
     {
       $group: {
         _id: null,
         avgPaymentAMount: { $avg: '$amount' },
       },
     },
   ]);

   const paymentGatewayDataPromise = Payment.aggregate([
     //stage 1 group stage
     {
       $group: {
         _id: { $ifNull: ['$paymentGatewayData.status', 'UNKNOWN'] },
         count: { $sum: 1 },
       },
     },
   ]);

   const [
     totalPayment,
     totalPaymentByStatus,
     totalRevenue,
     avgPaymentAmount,
     paymentGatewayData,
   ] = await Promise.all([
     totalPaymentPromise,
     totalPaymentByStatusPromise,
     totalRevenuePromise,
     avgPaymentAmountPromise,
     paymentGatewayDataPromise,
   ]);
   return {
     totalPayment,
     totalPaymentByStatus,
     totalRevenue,
     avgPaymentAmount,
     paymentGatewayData,
   };
};

/**
 * await Tour.updateMany(
        {
            // Only update where tourType or division is stored as a string
            $or: [
                { tourType: { $type: "string" } },
                { division: { $type: "string" } }
            ]
        },
        [
            {
                $set: {
                    tourType: { $toObjectId: "$tourType" },
                    division: { $toObjectId: "$division" }
                }
            }
        ]
    );
 */

export const StatsService = {
  getBookingStats,
  getPaymentStats,
  getTourStats,
  getUserStats,
};
