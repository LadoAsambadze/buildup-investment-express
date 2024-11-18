import Joi from "joi";
import { BuildingTypes } from "types/BuildingTypes";

const createBuildingSchema = Joi.object<BuildingTypes>({
  name: Joi.string().required().min(1).max(255),
  address: Joi.string().required().min(1).max(255),
  company_id: Joi.number().integer().required().positive(),
  desktop_paths: Joi.any().required(),
  mobile_paths: Joi.any().required(),
});

export default createBuildingSchema;
