import Joi from "joi";
import { CompanyTypes } from "types/CompanyTypes";

const createCompanySchema = Joi.object<CompanyTypes>({
  name: Joi.string().min(1).max(100).required(),
});

export default createCompanySchema;
