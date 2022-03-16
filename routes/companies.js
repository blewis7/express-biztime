const express = require("express");
const slugify = require("slugify");

const ExpressError = require("../expressError");
const db = require("../db");
let router = new express.Router();



// Get name and code from all companies in db
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query("SELECT code, name, description FROM companies ORDER BY name");
        return res.json({"companies": results.rows});
    } catch (err) {
        return next (err);
    }
});

// Get all information from company with specific code in params
router.get("/:code", async (req, res, next) => {
    try {
        let code = req.params.code
        const compResult = await db.query("SELECT * FROM companies WHERE code=$1", [code]);
        if (compResult.rows.length === 0){
            throw new ExpressError(`No company found with code: ${code}`, 404)
        }
        const invResult = await db.query("SELECT id FROM invoices WHERE comp_code=$1", [code]);
        const industResult = await db.query("SELECT i.industry FROM companies AS c INNER JOIN partnerships AS p ON (c.code = p.comp_code) INNER JOIN industries AS i ON (p.industry_code = i.code) WHERE c.code=$1", [code]);

        const company = compResult.rows[0];
        const invoices = invResult.rows;
        const industries = industResult.rows;

        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries.map(inv => inv.industry)
        return res.json({"company": company})
    } catch (err) {
        return next(err);
    }
});

// Post a new company into db
router.post("/", async (req, res, next) => {
    try {
        const {name, description} = req.body;
        const code = slugify(name, {lower: true});
        const result = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description", [code, name, description]);
        return res.status(201).json({"company": result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

// Update company information in db. Code is used to identify company in params
router.put("/:code", async (req, res, next) => {
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
router.delete("/:code", async (req, res, next) => {
    try {
        let code = req.params.code;
        const result = await db.query("DELETE FROM companies WHERE code=$1 RETURNING code", [code]);
        if (result.rows.length === 0){
            throw new ExpressError(`No company found with code: ${code}`, 404)
        } else {
            return res.json({"status": "deleted"});
        }  
    } catch (err) {
        return next(err);
    }
});

module.exports = router;