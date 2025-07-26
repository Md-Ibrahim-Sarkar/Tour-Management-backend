
import { deleteCloudinaryImage } from '../../config/cloudinary.config';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { tourSearchableFields } from './tour.constant';
import { ITour, ITourType } from './tour.interface';
import { Tour, TourType } from './tour.model';

const createTour = async (payload: ITour) => {
  const existingTour = await Tour.findOne({ title: payload.title });
  if (existingTour) {
    throw new Error('A tour with this title already exists.');
  }


  const tour = await Tour.create(payload);

  return tour;
};


const getAllTours = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Tour.find(), query);

  const tours = await queryBuilder
    .search(tourSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  // const meta = await queryBuilder.getMeta()

  const [data, meta] = await Promise.all([
    tours.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const updateTour = async (id: string, payload: Partial<ITour>) => {
  const existingTour = await Tour.findById(id);

  if (!existingTour) {
    throw new Error('Tour not found.');
  }


  // If images are provided, append them to the existing images
  if (payload.images && payload.images?.length > 0 && existingTour.images && existingTour.images.length > 0) {
    payload.images = [
      ...existingTour.images,
      ...payload.images
    ]
  }
  // If deletedImages are provided, filter out those images from the existing images
  if (payload.deletedImages && payload.deletedImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
    
    const restDBImages = existingTour.images.filter(imageurl => !payload.deletedImages?.includes(imageurl));
    
    const updatedPayloadImages = (payload.images || [])
      .filter(imageurl => !payload.deletedImages?.includes(imageurl))
      .filter(imageurl => !restDBImages.includes(imageurl));

    payload.images = [...restDBImages, ...updatedPayloadImages];
  }

  const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });


  // delete images from cloudinary if they are deleted
   if (
     payload.deletedImages &&
     payload.deletedImages.length > 0 &&
     existingTour.images &&
     existingTour.images.length > 0
   ) {
    await Promise.all(
      payload.deletedImages.map((imageUrl) => deleteCloudinaryImage(imageUrl))
    );
   }


  return updatedTour;
};

const deleteTour = async (id: string) => {
  return await Tour.findByIdAndDelete(id);
};

const createTourType = async (payload: ITourType) => {
  
  const existingTourType = await TourType.findOne({ name: payload.name });

  if (existingTourType) {
    throw new Error('Tour type already exists.');
  }

  return await TourType.create({ name: payload.name });
};



const getAllTourTypes = async () => {
  return await TourType.find();
};




const updateTourType = async (id: string, payload: ITourType) => {
  const existingTourType = await TourType.findById(id);
  if (!existingTourType) {
    throw new Error('Tour type not found.');
  }

  const updatedTourType = await TourType.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return updatedTourType;
};



const deleteTourType = async (id: string) => {
  const existingTourType = await TourType.findById(id);
  if (!existingTourType) {
    throw new Error('Tour type not found.');
  }

  return await TourType.findByIdAndDelete(id);
};

export const TourService = {
  createTour,
  createTourType,
  deleteTourType,
  updateTourType,
  getAllTourTypes,
  getAllTours,
  updateTour,
  deleteTour,
};
