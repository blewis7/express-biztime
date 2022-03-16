process.env.NODE_ENV = "test";

const { expect } = require("@jest/globals");
const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testComp;

beforeEach(async function() {
  let result = await db.query(`
    INSERT INTO
      companies (code, name, description) VALUES ('testcomp', 'Testing Companies', 'we are testing companies')
      RETURNING code, name, description`);
  testComp = result.rows[0];
});

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM companies");
  });
  
  afterAll(async function() {
    // close db connection
    await db.end();
  });


// Get request for companies
describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({companies: [testComp]});
    });
});

// Post request for companies
describe("POST /companies", function() {
  test("POST company to database", async function() {
      const result = {code: 'hello', name: 'HELLO WORLD', description: 'Hiya how are you?'};
      const response = await request(app).post(`/companies`).send(result);
      expect(response.statusCode).toBe(201);
      expect(response.body.company.code).toEqual('hello-world');
      expect(response.body.company.name).toEqual('HELLO WORLD');
      expect(response.body.company.description).toEqual('Hiya how are you?');
  });
});

// Post request for invoices
describe("POST /invoices", function() {
    test("POST invoice for new company", async function() {
        const result = {comp_code: 'testcomp', amt: 50};
        const response = await request(app).post(`/invoices`).send(result);
        expect(response.statusCode).toBe(201);
        expect(response.body.invoice.amt).toEqual(50);
        expect(response.body.invoice.comp_code).toEqual('testcomp');

    });
});