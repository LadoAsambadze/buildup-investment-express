import Joi from 'joi';

export const createApartmentsSchema = Joi.object({
  floor_plan_id: Joi.number().integer().required().description('The ID of the floor plan'),
  building_id: Joi.number().integer().required().description('The ID of the building for the apartments'),
  name: Joi.string().required().description('The name or label for the floor (e.g., "First Floor", "Penthouse")')
});


export const updateApartmentStatusSchema = Joi.object({
  status: Joi.valid('free', 'reserved', 'sold').required(),
  floor_plan_id: Joi.number().required(),
  flat_number: Joi.number().required()
});


export const updateSharedPropertiesSchema = Joi.object({
  flat_id: Joi.number(),
  image: Joi.string().optional(),
  square_meters: Joi.number().optional()
});