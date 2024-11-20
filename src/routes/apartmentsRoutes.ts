// routes/floorPlanRoutes.ts

import express, { Request, Response } from "express";

import { createApartments, getAllApartments, getApartmentsByBuilding } from "controllers/apartmentsController";
const apartmentsRoutes = express.Router();

// routes/floorPlanRoutes.ts

apartmentsRoutes.post(
  "/create-apartments",

  async (req: Request, res: Response) => {
    await createApartments(req, res);
  }
);


apartmentsRoutes.get(
  "/apartments",

  async (req: Request, res: Response) => {
    await getAllApartments(req, res);
  }
);
apartmentsRoutes.get(
  "/apartments/building/:id",

  async (req: Request, res: Response) => {
    await getApartmentsByBuilding(req, res);
  }
);

export default apartmentsRoutes;
