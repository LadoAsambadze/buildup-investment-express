import {
  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
} from "controllers/buildingController";
import express, { Request, Response } from "express";
import { upload } from "middlewares/uploadMiddleware";  // Assuming upload is defined in middlewares/uploadMiddleware

const buildingRoutes = express.Router();

// Route for fetching all buildings
buildingRoutes.get("/buildings", async (req: Request, res: Response) => {
  await getBuildings(req, res);
});

// Route for fetching a building by its ID
buildingRoutes.get("/buildings/:id", async (req: Request, res: Response) => {
  await getBuildingById(req, res);
});

// Route for creating a building
buildingRoutes.post(
  "/create-building",
  upload,  // Middleware to handle file uploads
  async (req: Request, res: Response) => {
    await createBuilding(req, res);
  }
);

// Route for updating a building
buildingRoutes.put(
  "/buildings/:id",
  upload,  // Add the upload middleware here as well
  async (req: Request, res: Response) => {
    await updateBuilding(req, res);
  }
);

// Route for deleting a building
buildingRoutes.delete("/buildings/:id", async (req: Request, res: Response) => {
  await deleteBuilding(req, res);
});

export default buildingRoutes;
