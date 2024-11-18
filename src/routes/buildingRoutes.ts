import {
  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
} from "controllers/buildingController";
import express, { Request, Response } from "express";
import { upload } from "middlewares/uploadMiddleware";

const buildingRoutes = express.Router();

buildingRoutes.get("/buildings", async (req: Request, res: Response) => {
  await getBuildings(req, res);
});

buildingRoutes.get("/buildings/:id", async (req: Request, res: Response) => {
  await getBuildingById(req, res);
});

buildingRoutes.post(
  "/buildings",
  upload,
  async (req: Request, res: Response) => {
    await createBuilding(req, res);
  }
);

buildingRoutes.put("/buildings/:id", async (req: Request, res: Response) => {
  await updateBuilding(req, res);
});

buildingRoutes.delete("/buildings/:id", async (req: Request, res: Response) => {
  await deleteBuilding(req, res);
});

export default buildingRoutes;
