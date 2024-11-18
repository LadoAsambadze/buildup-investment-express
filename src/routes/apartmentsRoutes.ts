// routes/floorPlanRoutes.ts

import express, { Request, Response } from "express";

import { createApartments } from "controllers/apartmentsController";
const apartmentsRoutes = express.Router();

// routes/floorPlanRoutes.ts

apartmentsRoutes.post(
  "/create-apartments",

  async (req: Request, res: Response) => {
    await createApartments(req, res);
  }
);

export default apartmentsRoutes;
