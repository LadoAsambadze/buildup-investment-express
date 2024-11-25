

import express, { Request, Response } from "express";
import { createApartments, getApartments, updateApartmentStatus, updateSharedProperties } from "controllers/apartmentsController";
 
 
const apartmentsRoutes = express.Router();

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
  "/update-apartment-status",

  async (req: Request, res: Response) => {
    await updateApartmentStatus(req, res);
  }
);



apartmentsRoutes.put(
  "/update-shared-properties",

  async (req: Request, res: Response) => {
    await updateSharedProperties(req, res);
  }
);







apartmentsRoutes.delete(
  "/apartments/:building_id",

  async (req: Request, res: Response) => {
    await getApartments(req, res);
  }
);


export default apartmentsRoutes;
