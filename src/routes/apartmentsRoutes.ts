// routes/floorPlanRoutes.ts

import express, { Request, Response } from "express";

import { createApartments, getApartments } from "controllers/apartmentsController";
const apartmentsRoutes = express.Router();

// routes/floorPlanRoutes.ts

apartmentsRoutes.post(
  "/create-apartments",

  async (req: Request, res: Response) => {
    await createApartments(req, res);
  }
);



apartmentsRoutes.get(
  "/apartments/:building_id",

  async (req: Request, res: Response) => {
    await getApartments(req, res);
  }
);
 

apartmentsRoutes.put(
  "/apartments/:id",

  async (req: Request, res: Response) => {
    await getApartments(req, res);
  }
);

apartmentsRoutes.delete(
  "/apartments/:id",

  async (req: Request, res: Response) => {
    await getApartments(req, res);
  }
);


export default apartmentsRoutes;
