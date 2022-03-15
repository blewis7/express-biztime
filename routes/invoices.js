const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

router.get("/invoices", async (req, res, next) =>{
    try {
        results = await db.query("SELECT id, comp_code FROM invoices");
        return res.json({"invoices": results.rows});
    } catch (err) {
        return next(err);
    }
});

// Get all information from invoice with specific id in params. Connect to companies table.
router.get("/invoices/:id", async (req, res, next) => {
    try {
        let id = req.params.id
        const result = await db.query("SELECT i.id, i.amt, i.add_date, i.paid_date,i.comp_code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1", [id]);
        if (result.length === 0){
            throw new ExpressError(`No invoice found with id: ${id}`, 404);
        } else {
            const data = result.rows[0];
            const invoice = {id: data.id, amt: data.amt, paid: data.paid, add_date: data.add_date, paid_date: data.paid_date, company: {code: data.comp_code, name: data.name, description: data.description}};
            return res.json({"invoice": invoice})
        }   
    } catch (err) {
        return next(err);
    }
});

// Post new invoice into invoices db
router.post("/invoices", async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date", [comp_code, amt]);
        return res.json({"invoice": result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

// Update invoice
router.put("/invoices/:id", async (req, res, next) => {
    try {
        let {amt, paid} = req.body;
        let id = req.params.id;
        let paidDate = null;
        const currResult = await db.query("SELECT paid FROM invoices WHERE id=$1", [id]);
        if (currResult.rows.length === 0){
            throw new ExpressError(`No invoice found with id: ${id}`, 404);
        }
        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid){
            paidDate = new Date();
        } else if (!paid){
            paidDate = null;
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query("UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date", [amt, paid, paidDate, id]);
        return res.json({"invoice": result.rows[0]});

    } catch (err) {
        return next(err);
    }
});

// Delete invoice 
router.delete("/invoices/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        const result = await db.query("DELETE FROM invoices WHERE id=$1 RETURNING id", [id]);
        if (result.rows.length === 0){
            throw new ExpressError(`No invoice found with id: ${id}`, 404)
        } else {
            return res.json({"Message": "Invoice Deleted"});
        }  
    } catch (err) {
        return next(err);
    }
});