import { Request, Response } from "express";
import pool from "../config/sql.js";
import createCompanySchema from "../schemas/createCompanySchema.js";

const createCompaniesTableIfNotExists = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);
    console.log("Table 'companies' is ready");
  } catch (error) {
    console.error("Error creating companies table:", error);
  }
};

export const createCompany = async (req: Request, res: Response) => {
  const { body } = req;
  await createCompaniesTableIfNotExists();

  try {
    const { value, error } = createCompanySchema.validate(body);
    if (error) {
      return res.status(400).json({
        status: "ERROR",
        error: "VALIDATION_ERROR",
        message: error.details[0].message,
      });
    }

    const { name } = value;
    const existingCompany = await pool.query(
      "SELECT * FROM companies WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existingCompany.rows.length > 0) {
      return res.status(409).json({
        status: "ERROR",
        error: "COMPANY_EXIST",
        message: "A company with this name already exists.",
      });
    }

    const result = await pool.query(
      "INSERT INTO companies (name) VALUES ($1) RETURNING *",
      [name]
    );

    return res.status(201).json({
      status: "SUCCESS",
      message: "Company created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        status: "ERROR",
        error: "SERVER_ERROR",
        message: "An error occurred while creating the company.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    return res.status(500).json({
      status: "ERROR",
      error: "UNKNOWN_ERROR",
      message: "An unknown error occurred while processing your request.",
    });
  }
};

export const getCompanies = async (_: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM companies ORDER BY name ASC"
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    if (error instanceof Error)
      return res.status(500).json({
        error: "An error occurred while fetching companies",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
  }
};

export const editCompany = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { body } = req;

  try {
    const { value, error } = createCompanySchema.validate(body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name } = value;
    const company = await pool.query("SELECT * FROM companies WHERE id = $1", [
      id,
    ]);

    if (company.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const existingCompany = await pool.query(
      "SELECT * FROM companies WHERE LOWER(name) = LOWER($1) AND id != $2",
      [name, id]
    );

    if (existingCompany.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "Company with this name already exists" });
    }

    const result = await pool.query(
      "UPDATE companies SET name = $1 WHERE id = $2 RETURNING *",
      [name, id]
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while updating the company",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const company = await pool.query("SELECT * FROM companies WHERE id = $1", [
      id,
    ]);

    if (company.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    await pool.query("DELETE FROM companies WHERE id = $1", [id]);

    return res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "An error occurred while deleting the company",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
    return res.status(500).json({ error: "An unknown error occurred" });
  }
};
