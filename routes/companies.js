const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

// Get name and code from all companies in db
router.get("/companies", async (req, res, next) => {
    try {
        const results = await db.query("SELECT code, name FROM companies");
        return res.json({"companies": results.rows});
    } catch (err){
        return next(err);
    }
});

// Get all information from company with specific code in params
router.get("/companies/:code", async (req, res, next) => {
    try {
        let code = req.params.code
        const compResult = await db.query("SELECT * FROM companies WHERE code=$1", [code]);
        if (compResult.rows.length === 0){
            throw new ExpressError(`No company found with code: ${code}`)
        }
        const invResult = await db.query("SELECT id FROM invoices WHERE comp_code=$1", [code]);

        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);
        return res.json({"company": company})
    } catch (err) {
        return next(err);
    }
});

// Post a new company into db
router.post("/companies", async (req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description]);
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        return next(err);
    }
});

// Update company information in db. Code is used to identify company in params
router.put("/companies/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        let {name, description} = req.body;
        const result = await db.query("UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description", [name, description, code]);
        if (result.rows.length === 0){
            throw new ExpressError(`No company found with code: ${code}`, 404)
        } else {
            return res.json({"company": result.rows[0]})
        }  
    } catch (err) {
        return next(err);
    }
});

// Delete company from db
router.delete("/companies/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        const result = await db.query("DELETE FROM companies WHERE code=$1 RETURNING code", [code]);
        if (result.rows.length === 0){
            throw new ExpressError(`No company found with code: ${code}`, 404)
        } else {
            return res.json({"Message": "Company Deleted"});
        }  
    } catch (err) {
        return next(err);
    }
});