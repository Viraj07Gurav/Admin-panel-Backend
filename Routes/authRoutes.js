//connected to server.js
const express=require("express")
const mysql=require("mysql")
const cors=require("cors")
const jwt=require("jsonwebtoken")
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router=express.Router();
require("dotenv").config(); // Load environment variables
const db=require('../db')

const ADMIN_EMAIL=process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;
const ADMIN_NAME=process.env.ADMIN_NAME;
const JWT_SECRET=process.env.JWT_SECRET;

//post method store user credential in DB . registration page
router.post("/users", (req, res) => {
    const { username, email, password, role = 'user' } = req.body;
    if (email === ADMIN_EMAIL) {
        return res.status(401).json({ message: "Email already used" });
    }
    // Check if the user already exists
    const checkUserSql = "SELECT * FROM usertable WHERE email = ?";
    db.query(checkUserSql, [email], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Database error" });
        } else if (result.length > 0) {
            // User already exists
            res.status(400).json({ message: "User already exists" });
        } else {
            // Insert new user
            const insertUserSql = "INSERT INTO usertable (username, email, password,role) VALUES (?, ?, ?,?)";
            db.query(insertUserSql, [username, email, password, role], (err, result) => {
                if (err) {
                    res.status(500).json({ error: "user already exists" });
                } else {
                    res.status(201).json({ message: "User added successfully", userId: result.insertId });
                }
            });
        }
    });
});

//login page check user credential with DB and create token on successful login
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("email", email);
    console.log("password", password);

    //  Hardcoded Admin Credentials
    // const ADMIN_EMAIL = "admin@example.com";
    // const ADMIN_PASSWORD = "admin123";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        //  Generate JWT for Admin with role "admin"
        const token = jwt.sign({ email, role: "admin", username: ADMIN_NAME }, JWT_SECRET, { expiresIn: "1h" });

        return res.json({ message: "Admin login successful", role: "admin", username: ADMIN_NAME, token });
    }
    if (email === ADMIN_EMAIL) {
        return res.status(401).json({ message: "Email already used" });
    }

    //  Check Normal Users in Database
    const sql = "SELECT * FROM usertable WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, result) => {
        console.log("result", result);
        console.log("err", err);

        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        if (result.length > 0) {
            //  Generate token with role "user"
            const token = jwt.sign({ email, role: "user" }, JWT_SECRET, { expiresIn: "1h" });

            return res.json({ message: "Login successful", role: "user", user: result[0], token });
        }

        return res.status(401).json({ message: "Invalid email or password" });
    });
});

module.exports=router;



