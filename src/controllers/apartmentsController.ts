import pool from "config/sql";
import { Request, Response } from "express";
import { createApartmentsSchema } from "../schemas/createApartmentsSchema";

// Create a table for apartments if it doesn't exist
const createApartmentsTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS apartments (
        id SERIAL PRIMARY KEY,
        flat_id INT NOT NULL,
        flat_number INT NOT NULL,
        floor INT NOT NULL,
        building_id INT NOT NULL,
        floor_plan_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'free', 
        image TEXT,
        square_meters DECIMAL(10,2) DEFAULT 0,
        CHECK (status IN ('free', 'reserved', 'sold')),
        CONSTRAINT unique_apartment UNIQUE (building_id, name, floor_plan_id)
      );
    `);
    console.log("Table 'apartments' is ready");
  } catch (error) {
    console.error("Error creating apartments table:", error);
  }
};

// Function to check if the building exists
const checkIfBuildingExists = async (buildingId: number) => {
  const result = await pool.query(
    "SELECT 1 FROM buildings WHERE id = $1",
    [buildingId]
  );
  return result.rows.length > 0;
};

// Function to check if the floor plan exists
const checkIfFloorPlanExists = async (floorPlanId: number) => {
  const result = await pool.query(
    "SELECT 1 FROM floor_plans WHERE id = $1",
    [floorPlanId]
  );
  return result.rows.length > 0;
};

// Function to check if apartments with the same building_id, name, and floor_plan_id already exist
const checkExistingApartments = async (buildingId: number, name: string, floorPlanId: number) => {
  const result = await pool.query(`
    SELECT * FROM apartments 
    WHERE building_id = $1 AND name = $2 AND floor_plan_id = $3
  `, [buildingId, name, floorPlanId]);

  return result.rows.length > 0;
};

// Function to generate apartments based on the floor plan info
const generateApartments = async (buildingId: number, name: string, floorPlanId: number) => {
  try {
    const floorPlanResult = await pool.query(
      "SELECT * FROM floor_plans WHERE id = $1",
      [floorPlanId]
    );

    if (floorPlanResult.rows.length === 0) {
      console.error(`Floor plan with ID ${floorPlanId} not found.`);
      throw new Error("Floor plan not found");
    }

    const floorPlan = floorPlanResult.rows[0];
    const { floor_range_start, floor_range_end, starting_apartment_number, apartments_per_floor } = floorPlan;

    let currentFlatNumber = starting_apartment_number;
    const apartmentsByFloor = [];

    for (let floor = floor_range_start; floor <= floor_range_end; floor++) {
      const apartments = [];

      for (let flatIndex = 0; flatIndex < apartments_per_floor; flatIndex++) {
        const flatId = flatIndex + 1;
        const flatNumber = currentFlatNumber++;

        // Insert apartment record with the main values: building_id and floor_plan_id
        await pool.query(
          "INSERT INTO apartments (flat_id, flat_number, floor, building_id, floor_plan_id, name, status, image, square_meters) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [flatId, flatNumber, floor, buildingId, floorPlanId, name, 'free', null, 0]
        );

        apartments.push({
          flat_id: flatId,
          flat_number: flatNumber,
          status: 'free'
        });
      }

      apartmentsByFloor.push({
        floor,
        apartments,
      });
    }

    return apartmentsByFloor;
  } catch (error) {
    console.error("Error generating apartments:", error);
    throw error;
  }
};

// Controller function to create apartments based on floor plan info
export const createApartments = async (req: Request, res: Response) => {
  const { building_id, name, floor_plan_id } = req.body;

  // Ensure the apartments table exists
  await createApartmentsTableIfNotExists();

  try {
    // Validate the input data
    const { value, error } = createApartmentsSchema.validate({ building_id, name, floor_plan_id });
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    const { building_id: validatedBuildingId, name: validatedName, floor_plan_id: validatedFloorPlanId } = value;

    // Check if the building exists
    const buildingExists = await checkIfBuildingExists(validatedBuildingId);
    if (!buildingExists) {
      return res.status(400).json({
        status: "ERROR",
        error: "BUILDING_NOT_FOUND",
        message: `Building with ID ${validatedBuildingId} does not exist.`,
      });
    }

    // Check if the floor plan exists
    const floorPlanExists = await checkIfFloorPlanExists(validatedFloorPlanId);
    if (!floorPlanExists) {
      return res.status(400).json({
        status: "ERROR",
        error: "FLOOR_PLAN_NOT_FOUND",
        message: `Floor plan with ID ${validatedFloorPlanId} does not exist.`,
      });
    }

    // Check if apartments with the same building_id, name, and floor_plan_id already exist
    const existingApartments = await checkExistingApartments(validatedBuildingId, validatedName, validatedFloorPlanId);
    if (existingApartments) {
      return res.status(400).json({
        status: "ERROR",
        error: "DUPLICATE_APARTMENTS",
        message: "Apartments with the same building_id, name, and floor_plan_id already exist.",
      });
    }

    // Generate apartments based on the floor plan info
    const apartmentsByFloor = await generateApartments(validatedBuildingId, validatedName, validatedFloorPlanId);

    // Return a success response with the generated apartments grouped by floor
    return res.status(201).json({
      status: "SUCCESS",
      message: "Apartments generated successfully.",
      apartments: apartmentsByFloor, // Return the array of apartments
    });
  } catch (error) {
    // Handle unexpected errors
    if (error instanceof Error) {
      return res.status(500).json({
        status: "ERROR",
        error: "SERVER_ERROR",
        message: "An error occurred while generating apartments.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // Fallback for any other unexpected errors
    return res.status(500).json({
      status: "ERROR",
      error: "UNKNOWN_ERROR",
      message: "An unknown error occurred while processing your request.",
    });
  }
};
