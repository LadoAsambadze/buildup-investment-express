import Joi from 'joi';

export const createApartmentsSchema = Joi.object({
  floor_plan_id: Joi.number().integer().required().description('The ID of the floor plan'),
  building_id: Joi.number().integer().required().description('The ID of the building for the apartments'),
  name: Joi.string().required().description('The name or label for the floor (e.g., "First Floor", "Penthouse")')
});