require("dotenv").config(); // Load environment variables3
const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const db = require('../db')

const ADMIN_EMAIL=process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;
const ADMIN_NAME=process.env.ADMIN_NAME;
const JWT_SECRET=process.env.JWT_SECRET;

router.post("/admin/login",(req,res)=>{
      const { email, password } = req.body;
        console.log("email", email);
        console.log("password", password);
    
    
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            //  Generate JWT for Admin with role "admin"
            const token = jwt.sign({ email, role: "admin", username: ADMIN_NAME }, JWT_SECRET, { expiresIn: "1h" });
    
            return res.json({ message: "Admin login successful", role: "admin", username: ADMIN_NAME, token });
        }else{
          return res.status(401).json({message:"invalide username and password "});
        }
})
module.exports=router;