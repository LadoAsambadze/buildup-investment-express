import { Request, Response } from "express";
import pool from "../config/sql";
import createBuildingSchema from "schemas/createBuildingSchema";

const createBuildingsTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS buildings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        company_id INTEGER NOT NULL,
        desktop_image TEXT NOT NULL,
        desktop_paths JSONB NOT NULL,  -- Changed to JSONB
        mobile_paths JSONB NOT NULL,   -- Changed to JSONB
        mobile_image TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE(name, company_id)
      );
    `);
    console.log("Table 'buildings' is ready");
  } catch (error) {
    console.error("Error creating buildings table:", error);
  }
};


export const createBuilding = async (req: Request, res: Response) => {

  await createBuildingsTableIfNotExists()
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const { body } = req;

    // Validate request body against the schema
    const { value, error } = createBuildingSchema.validate(body);
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    const { name, address, company_id, desktop_paths, mobile_paths } = value;

    // Check if company exists
    const company = await pool.query("SELECT * FROM companies WHERE id = $1", [
      company_id,
    ]);

    if (company.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "COMPANY_NOT_FOUND",
        message: `Company with ID ${company_id} does not exist.`,
      });
    }

    // Handle the case where desktop_paths and mobile_paths are strings (i.e., JSON stringified)
    let parsedDesktopPaths = desktop_paths;
    let parsedMobilePaths = mobile_paths;

    // If they are strings, parse them into objects
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

    // Validate that desktop_paths and mobile_paths are now objects
    if (typeof parsedDesktopPaths !== 'object' || Array.isArray(parsedDesktopPaths) ||
        typeof parsedMobilePaths !== 'object' || Array.isArray(parsedMobilePaths)) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: "desktop_paths and mobile_paths must be objects",
      });
    }

    // Check for duplicate building names
    const existingBuilding = await pool.query(
      "SELECT * FROM buildings WHERE LOWER(name) = LOWER($1) AND company_id = $2",
      [name, company_id]
    );
    if (existingBuilding.rows.length > 0) {
      return res.status(409).json({
        status: "ERROR",
        error: "BUILDING_EXISTS",
        message: "Building with this name already exists for this company",
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

    // Insert the building with JSONB objects
    const result = await pool.query(
      `INSERT INTO buildings (
        name, address, company_id, desktop_paths, mobile_paths, desktop_image, mobile_image
      ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7) RETURNING *`,
      [
        name,
        address,
        company_id,
        JSON.stringify(parsedDesktopPaths), // Convert object to JSONB
        JSON.stringify(parsedMobilePaths),  // Convert object to JSONB
        desktopImageUrl,
        mobileImageUrl,
      ]
    );

    // Parse JSONB fields back to objects in the response
    const building = result.rows[0];

    return res.status(201).json({
      status: "SUCCESS",
      message: "Building created successfully",
      data: building,
    });
  } catch (error) {
    console.error("Error creating building:", error);
    return res.status(500).json({
      status: "ERROR",
      error: "SERVER_ERROR",
      message: "An error occurred while creating the building",
    });
  }
};



export const getBuildings = async (req: Request, res: Response) => {
  const { company_id } = req.query;

  try {
    let query = `
      SELECT b.*, c.name as company_name 
      FROM buildings b
      JOIN companies c ON b.company_id = c.id
    `;
    const queryParams = [];

    if (company_id) {
      query += " WHERE b.company_id = $1";
      queryParams.push(company_id);
    }

    query += " ORDER BY b.name ASC";

    const result = await pool.query(query, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while fetching buildings",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
};

export const getBuildingById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT b.*, c.name as company_name 
       FROM buildings b
       JOIN companies c ON b.company_id = c.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Building not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while fetching the building",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
};

export const updateBuilding = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body } = req;

  console.log("123m", body)
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  try {
    // Validate request body against the schema
    const { value, error } = createBuildingSchema.validate(body);
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERRORrrrrrrrrr",
        message: error.details[0].message,
      });
    }

    const { 
      name, 
      address, 
      company_id, 
      desktop_paths, 
      mobile_paths 
    } = value;

    // Check if building exists
    const buildingCheck = await pool.query("SELECT * FROM buildings WHERE id = $1", [id]);
    if (buildingCheck.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "BUILDING_NOT_FOUND",
        message: `Building with ID ${id} does not exist.`,
      });
    }

    // Check if company exists
    const company = await pool.query("SELECT * FROM companies WHERE id = $1", [company_id]);
    if (company.rows.length === 0) {
      return res.status(404).json({
        status: "ERROR",
        error: "COMPANY_NOT_FOUND",
        message: `Company with ID ${company_id} does not exist.`,
      });
    }

    // Check for duplicate building names (excluding current building)
    const existingBuilding = await pool.query(
      "SELECT * FROM buildings WHERE LOWER(name) = LOWER($1) AND company_id = $2 AND id != $3",
      [name, company_id, id]
    );
    if (existingBuilding.rows.length > 0) {
      return res.status(409).json({
        status: "ERROR",
        error: "BUILDING_EXISTS",
        message: "Building with this name already exists for this company",
      });
    }

    // Handle file uploads (similar to createBuilding)
    let desktopImageUrl = buildingCheck.rows[0].desktop_image;
    let mobileImageUrl = buildingCheck.rows[0].mobile_image;

    if (files?.desktop_image && files.desktop_image[0]) {
      desktopImageUrl = files.desktop_image[0].path;
    }
    if (files?.mobile_image && files.mobile_image[0]) {
      mobileImageUrl = files.mobile_image[0].path;
    }

    // Parse paths if they are strings
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

    // Validate that desktop_paths and mobile_paths are objects
    if (typeof parsedDesktopPaths !== 'object' || Array.isArray(parsedDesktopPaths) ||
        typeof parsedMobilePaths !== 'object' || Array.isArray(parsedMobilePaths)) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: "desktop_paths and mobile_paths must be objects",
      });
    }

    // Update the building
    const result = await pool.query(
      `UPDATE buildings 
       SET name = $1, 
           address = $2, 
           company_id = $3, 
           desktop_paths = $4::jsonb, 
           mobile_paths = $5::jsonb, 
           desktop_image = $6, 
           mobile_image = $7 
       WHERE id = $8 
       RETURNING *`,
      [
        name,
        address,
        company_id,
        JSON.stringify(parsedDesktopPaths),
        JSON.stringify(parsedMobilePaths),
        desktopImageUrl,
        mobileImageUrl,
        id
      ]
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Building updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating building:", error);
    return res.status(500).json({
      status: "ERROR",
      error: "SERVER_ERROR",
      message: "An error occurred while updating the building",
    });
  }
};

export const deleteBuilding = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if building exists
    const building = await pool.query("SELECT * FROM buildings WHERE id = $1", [
      id,
    ]);
    if (building.rows.length === 0) {
      return res.status(404).json({ error: "Building not found" });
    }

    await pool.query("DELETE FROM buildings WHERE id = $1", [id]);
    return res.status(200).json({ message: "Building deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while deleting the building",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
};
