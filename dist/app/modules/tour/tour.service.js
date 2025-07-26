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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourService = void 0;
const cloudinary_config_1 = require("../../config/cloudinary.config");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const tour_constant_1 = require("./tour.constant");
const tour_model_1 = require("./tour.model");
const createTour = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTour = yield tour_model_1.Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error('A tour with this title already exists.');
    }
    const tour = yield tour_model_1.Tour.create(payload);
    return tour;
});
const getAllTours = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(tour_model_1.Tour.find(), query);
    const tours = yield queryBuilder
        .search(tour_constant_1.tourSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    // const meta = await queryBuilder.getMeta()
    const [data, meta] = yield Promise.all([
        tours.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
});
const updateTour = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existingTour = yield tour_model_1.Tour.findById(id);
    if (!existingTour) {
        throw new Error('Tour not found.');
    }
    // If images are provided, append them to the existing images
    if (payload.images && ((_a = payload.images) === null || _a === void 0 ? void 0 : _a.length) > 0 && existingTour.images && existingTour.images.length > 0) {
        payload.images = [
            ...existingTour.images,
            ...payload.images
        ];
    }
    // If deletedImages are provided, filter out those images from the existing images
    if (payload.deletedImages && payload.deletedImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        const restDBImages = existingTour.images.filter(imageurl => { var _a; return !((_a = payload.deletedImages) === null || _a === void 0 ? void 0 : _a.includes(imageurl)); });
        const updatedPayloadImages = (payload.images || [])
            .filter(imageurl => { var _a; return !((_a = payload.deletedImages) === null || _a === void 0 ? void 0 : _a.includes(imageurl)); })
            .filter(imageurl => !restDBImages.includes(imageurl));
        payload.images = [...restDBImages, ...updatedPayloadImages];
    }
    const updatedTour = yield tour_model_1.Tour.findByIdAndUpdate(id, payload, { new: true });
    // delete images from cloudinary if they are deleted
    if (payload.deletedImages &&
        payload.deletedImages.length > 0 &&
        existingTour.images &&
        existingTour.images.length > 0) {
        yield Promise.all(payload.deletedImages.map((imageUrl) => (0, cloudinary_config_1.deleteCloudinaryImage)(imageUrl)));
    }
    return updatedTour;
});
const deleteTour = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield tour_model_1.Tour.findByIdAndDelete(id);
});
const createTourType = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findOne({ name: payload.name });
    if (existingTourType) {
        throw new Error('Tour type already exists.');
    }
    return yield tour_model_1.TourType.create({ name: payload.name });
});
const getAllTourTypes = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield tour_model_1.TourType.find();
});
const updateTourType = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findById(id);
    if (!existingTourType) {
        throw new Error('Tour type not found.');
    }
    const updatedTourType = yield tour_model_1.TourType.findByIdAndUpdate(id, payload, {
        new: true,
    });
    return updatedTourType;
});
const deleteTourType = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findById(id);
    if (!existingTourType) {
        throw new Error('Tour type not found.');
    }
    return yield tour_model_1.TourType.findByIdAndDelete(id);
});
exports.TourService = {
    createTour,
    createTourType,
    deleteTourType,
    updateTourType,
    getAllTourTypes,
    getAllTours,
    updateTour,
    deleteTour,
};
