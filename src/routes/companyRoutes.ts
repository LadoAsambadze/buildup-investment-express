import {
  createCompany,
  deleteCompany,
  editCompany,
  getCompanies,
} from "controllers/companyController";
import express, { Request, Response } from "express";

const companyRoutes = express.Router();

companyRoutes.get("/companies", async (req: Request, res: Response) => {
  await getCompanies(req, res);
});

companyRoutes.post("/create-company", async (req: Request, res: Response) => {
  await createCompany(req, res);
});

companyRoutes.delete("/companies/:id", async (req: Request, res: Response) => {
  await deleteCompany(req, res);
});

companyRoutes.put("/companies/:id", async (req: Request, res: Response) => {
  await editCompany(req, res);
});

export default companyRoutes;
