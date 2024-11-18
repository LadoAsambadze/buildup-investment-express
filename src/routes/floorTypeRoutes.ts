// routes/floorPlanRoutes.ts

import {
  createFloorPlan,
  deleteFloorPlan,
  editFloorPlan,
  getFloorPlans,
} from "controllers/floorTypeController";
import express, { Request, Response } from "express";
import { upload } from "../middlewares/uploadMiddleware";
const floorPlanRoutes = express.Router();

// routes/floorPlanRoutes.ts

floorPlanRoutes.post(
  "/create-floor-plan",
  upload, // Add the upload middleware here
  async (req: Request, res: Response) => {
    await createFloorPlan(req, res);
  }
);

floorPlanRoutes.get("/floor-plans", async (req: Request, res: Response) => {
  await getFloorPlans(req, res);
});

floorPlanRoutes.delete(
  "/floor-plans/:id",
  async (req: Request, res: Response) => {
    await deleteFloorPlan(req, res);
  }
);
floorPlanRoutes.put("/floor-plans/:id", async (req: Request, res: Response) => {
  await editFloorPlan(req, res);
});

export default floorPlanRoutes;
