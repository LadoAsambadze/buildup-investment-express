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
        floor_plan_id INT NOT NULL,
        FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id)
      );
    `);
    console.log("Table 'apartments' is ready");
  } catch (error) {
    console.error("Error creating apartments table:", error);
  }
};

// Function to generate apartments based on floor plan info
const generateApartments = async (floorPlanId: number) => {
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

    // Extract floor plan data
    const {
      floor_range_start,
      floor_range_end,
      starting_apartment_number,
      apartments_per_floor,
    } = floorPlan;

    let currentFlatNumber = starting_apartment_number;
    const apartmentsByFloor = [];

    // Loop through each floor in the range and generate apartments for each floor
    for (let floor = floor_range_start; floor <= floor_range_end; floor++) {
      const apartments = [];

      // Reset flat_id for each new floor
      for (let flatIndex = 0; flatIndex < apartments_per_floor; flatIndex++) {
        const flatId = flatIndex + 1; // Flat ID starts from 1 for each floor
        const flatNumber = currentFlatNumber++;

        // Insert apartment record into the apartments table
        await pool.query(
          "INSERT INTO apartments (flat_id, flat_number, floor, floor_plan_id) VALUES ($1, $2, $3, $4)",
          [flatId, flatNumber, floor, floorPlanId]
        );

        // Add apartment to the array for the current floor
        apartments.push({
          flat_id: flatId,
          flat_number: flatNumber,
        });
      }

      // Add floor with its apartments to the main array
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
  const { floor_plan_id } = req.body;

  // Ensure the apartments table exists
  await createApartmentsTableIfNotExists();

  try {
    // Validate the floor plan ID provided in the request
    const { value, error } = createApartmentsSchema.validate({ floor_plan_id });
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    const { floor_plan_id: validatedFloorPlanId } = value;

    // Generate apartments based on the floor plan info
    const apartmentsByFloor = await generateApartments(validatedFloorPlanId);

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
