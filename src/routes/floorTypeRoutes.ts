import {
  createFloorPlan,
  deleteFloorPlan,
  editFloorPlan,
  getFloorPlans,
  getFloorPlansByBuildingId, // Add this function to handle the specific query by building_id
} from "controllers/floorTypeController";
import express, { Request, Response } from "express";
import { upload } from "../middlewares/uploadMiddleware";

const floorPlanRoutes = express.Router();

// Create floor plan route
floorPlanRoutes.post(
  "/create-floor-plan",
  upload, // Add the upload middleware here
  async (req: Request, res: Response) => {
    await createFloorPlan(req, res);
  }
);

// Get all floor plans
floorPlanRoutes.get("/floor-plans", async (req: Request, res: Response) => {
  await getFloorPlans(req, res);
});

// Get floor plans by building ID
floorPlanRoutes.get("/floor-plans/:id", async (req: Request, res: Response) => {
  await getFloorPlansByBuildingId(req, res); // Fetch floor plans for a specific building
});

// Delete floor plan
floorPlanRoutes.delete(
  "/floor-plans/:id",
  async (req: Request, res: Response) => {
    await deleteFloorPlan(req, res);
  }
);

// Edit floor plan
floorPlanRoutes.put("/floor-plans/:id", async (req: Request, res: Response) => {
  await editFloorPlan(req, res);
});

export default floorPlanRoutes;
