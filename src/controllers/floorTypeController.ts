import pool from "config/sql";

import { Request, Response } from "express";
import { createFloorPlanSchema } from "../schemas/createFloorTypeSchema";

async function ensureTablesExist() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS floor_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        building_id INTEGER NOT NULL REFERENCES buildings(id),
        desktop_image TEXT NOT NULL,
        mobile_image TEXT NOT NULL,
        desktop_paths JSONB NOT NULL,  -- Changed from TEXT[] to JSONB
        mobile_paths JSONB NOT NULL,   -- Changed from TEXT[] to JSONB
        floor_range_start INTEGER NOT NULL,
        floor_range_end INTEGER NOT NULL,
        starting_apartment_number INTEGER NOT NULL,
        apartments_per_floor INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, building_id)
      )
    `);
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  } finally {
    client.release();
  }
}

export const createFloorPlan = async (req: Request, res: Response) => {
  const { body, files } = req;
  await ensureTablesExist().catch(() => console.log("Table creation failed"));

  try {
    // Validate request body against the schema
    const { value, error } = createFloorPlanSchema.validate(body);
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    const {
      name,
      building_id,
      floor_range_start,
      floor_range_end,
      starting_apartment_number,
      apartments_per_floor,
      desktop_paths,
      mobile_paths,
    } = value;

    // Check if the building exists
    const buildingExists = await pool.query(
      "SELECT * FROM buildings WHERE id = $1",
      [building_id]
    );

    if (buildingExists.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "BUILDING_NOT_FOUND",
        message: "Building with this ID does not exist.",
      });
    }

    // Check if the floor plan already exists in the database
    const existingFloorPlan = await pool.query(
      "SELECT * FROM floor_plans WHERE LOWER(name) = LOWER($1) AND building_id = $2",
      [name, building_id]
    );

    if (existingFloorPlan.rows.length > 0) {
      return res.status(409).json({
        status: "ERROR",
        error: "FLOOR_PLAN_EXIST",
        message: "A floor plan with this name already exists for this building.",
      });
    }

    // Parse paths similar to building creation
    let parsedDesktopPaths = desktop_paths;
    let parsedMobilePaths = mobile_paths;

    if (typeof parsedDesktopPaths === 'string') {
      try {
        parsedDesktopPaths = JSON.parse(parsedDesktopPaths);
      } catch (err) {
        return res.status(400).json({
          status: "ERROR",
          error: "VALIDATION_ERROR",
          message: "desktop_paths must be a valid JSON object",
        });
      }
    }

    if (typeof parsedMobilePaths === 'string') {
      try {
        parsedMobilePaths = JSON.parse(parsedMobilePaths);
      } catch (err) {
        return res.status(400).json({
          status: "ERROR",
          error: "VALIDATION_ERROR",
          message: "mobile_paths must be a valid JSON object",
        });
      }
    }

    if (typeof parsedDesktopPaths !== 'object' || Array.isArray(parsedDesktopPaths) ||
        typeof parsedMobilePaths !== 'object' || Array.isArray(parsedMobilePaths)) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: "desktop_paths and mobile_paths must be objects",
      });
    }

    // Handle file uploads
    let desktopImageUrl = "";
    let mobileImageUrl = "";
    if (files?.desktop_image && files.desktop_image[0]) {
      desktopImageUrl = files.desktop_image[0].path;
    }
    if (files?.mobile_image && files.mobile_image[0]) {
      mobileImageUrl = files.mobile_image[0].path;
    }

    // Insert the new floor plan into the database
    const result = await pool.query(
      `INSERT INTO floor_plans (
        name, building_id, desktop_image, mobile_image, 
        desktop_paths, mobile_paths,
        floor_range_start, floor_range_end, 
        starting_apartment_number, apartments_per_floor
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10) RETURNING *`,
      [
        name,
        building_id,
        desktopImageUrl,
        mobileImageUrl,
        JSON.stringify(parsedDesktopPaths),
        JSON.stringify(parsedMobilePaths),
        floor_range_start,
        floor_range_end,
        starting_apartment_number,
        apartments_per_floor,
      ]
    );

    res.status(201).json({
      status: "SUCCESS",
      message: "Floor plan created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating floor plan:", error);
    res.status(500).json({
      status: "ERROR",
      error: "SERVER_ERROR",
      message: "An error occurred while creating the floor plan",
    });
  }
};

export const getFloorPlans = async (_: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM floor_plans ORDER BY name ASC"
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while fetching floor plans",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
};

// Get floor plans for a specific building based on the building_id
export const getFloorPlansByBuildingId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ensure id is provided and valid
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        status: 'ERROR',
        error: 'INVALID_BUILDING_ID',
        message: 'A valid building ID must be provided'
      });
    }

    // Query to fetch floor plans for a specific building ID
    const query = "SELECT * FROM floor_plans WHERE building_id = $1 ORDER BY name ASC";
    const result = await pool.query(query, [Number(id)]);

    // Check if there are any results for the given building_id
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        error: 'NOT_FOUND',
        message: 'No floor plans found for the provided building ID'
      });
    }

    return res.status(200).json(result.rows);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        status: 'ERROR',
        error: 'SERVER_ERROR',
        message: 'An error occurred while fetching floor plans',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    return res.status(500).json({
      status: 'ERROR',
      error: 'SERVER_ERROR',
      message: 'An unknown server error occurred'
    });
  }
};



export const deleteFloorPlan = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM floor_plans WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "FLOOR_PLAN_NOT_FOUND",
        message: "Floor plan with this ID does not exist.",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Floor plan deleted successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting floor plan:", error);
    res.status(500).json({
      status: "ERROR",
      error: "INTERNAL_SERVER_ERROR",
      message: "An error occurred while deleting the floor plan.",
    });
  }
};


export const editFloorPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body } = req;

  try {
    // Validate the request body
    const { value, error } = createFloorPlanSchema.validate(body);
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    // Update the floor plan in the database
    const {
      name,
      building_id,
      floor_range_start,
      floor_range_end,
      starting_apartment_number,
      apartments_per_floor,
      desktop_paths,
      mobile_paths,
    } = value;

    const result = await pool.query(
      `
      UPDATE floor_plans
      SET
        name = $1,
        building_id = $2,
        floor_range_start = $3,
        floor_range_end = $4,
        starting_apartment_number = $5,
        apartments_per_floor = $6,
        desktop_paths = $7,
        mobile_paths = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
      `,
      [
        name,
        building_id,
        floor_range_start,
        floor_range_end,
        starting_apartment_number,
        apartments_per_floor,
        desktop_paths,
        mobile_paths,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "FLOOR_PLAN_NOT_FOUND",
        message: "Floor plan with this ID does not exist.",
      });
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Floor plan updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating floor plan:", error);
    res.status(500).json({
      status: "ERROR",
      error: "INTERNAL_SERVER_ERROR",
      message: "An error occurred while updating the floor plan.",
    });
  }
};
