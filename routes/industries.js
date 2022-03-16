const express = require("express");

const ExpressError = require("../expressError");
const db = require("../db");
let router = new express.Router();

// Get code and industry from all industries in db
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query("SELECT code, industry FROM industries ORDER BY industry");
        return res.json({"industries": results.rows});
    } catch (err) {
        return next (err);
    }
});

// Get all information from industry with specific code in params
router.get("/:code", async (req, res, next) => {
    try {
        let code = req.params.code
        const indResult = await db.query("SELECT code, industry FROM industries WHERE code=$1", [code]);
        if (indResult.rows.length === 0){
            throw new ExpressError(`No industry found with code: ${code}`, 404)
        }
        
        const compResult = await db.query("SELECT c.name FROM industries AS i INNER JOIN partnerships AS p ON (i.code = p.industry_code) INNER JOIN companies AS c ON (p.comp_code = c.code) WHERE i.code=$1", [code]);

        const industry = indResult.rows[0];
        const companies = compResult.rows;

        industry.companies = companies.map(inv => inv.name)
        return res.json({"industry": industry})
    } catch (err) {
        return next(err);
    }
});

// Post a new industry into db
router.post("/", async (req, res, next) => {
    try {
        const {code, industry} = req.body;
        const result = await db.query("INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry", [code, industry]);
        return res.status(201).json({"industry": result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;