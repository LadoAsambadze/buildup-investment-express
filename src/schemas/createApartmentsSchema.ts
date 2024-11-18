import Joi from "joi";

// Define the schema to validate the floor_plan_id
export const createApartmentsSchema = Joi.object({
  floor_plan_id: Joi.number().integer().required().messages({
    "number.base": '"floor_plan_id" must be a number',
    "number.integer": '"floor_plan_id" must be an integer',
    "any.required": '"floor_plan_id" is required',
  }),
});
