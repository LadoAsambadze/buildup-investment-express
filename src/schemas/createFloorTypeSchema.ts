// schemas/createFloorPlanSchema.ts
import Joi from "joi";
import { FloorPlanType } from "../types/FloorPlanTypes";

export const createFloorPlanSchema = Joi.object<FloorPlanType>({
  name: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Name cannot be empty",
    "string.max": "Name cannot exceed 100 characters",
  }),

  building_id: Joi.number().integer().positive().required().messages({
    "number.base": "Building ID must be a number",
    "number.positive": "Building ID must be positive",
  }),

  desktop_paths: Joi.any().required().messages({
    "object.base": "Desktop paths must be an object",
    "any.required": "Desktop paths are required",
  }),

  mobile_paths: Joi.any().required().messages({
    "object.base": "Mobile paths must be an object",
    "any.required": "Mobile paths are required",
  }),

  floor_range_start: Joi.number().integer().min(1).required().messages({
    "number.base": "Floor range start must be a number",
    "number.min": "Floor range start must be at least 1",
  }),

  floor_range_end: Joi.number()
    .integer()
    .min(Joi.ref("floor_range_start"))
    .required()
    .messages({
      "number.base": "Floor range end must be a number",
      "number.min":
        "Floor range end must be greater than or equal to floor range start",
    }),

  starting_apartment_number: Joi.number().integer().min(1).required().messages({
    "number.base": "Starting apartment number must be a number",
    "number.min": "Starting apartment number must be at least 1",
  }),

  apartments_per_floor: Joi.number().integer().min(1).required().messages({
    "number.base": "Apartments per floor must be a number",
    "number.min": "Apartments per floor must be at least 1",
  }),
});
