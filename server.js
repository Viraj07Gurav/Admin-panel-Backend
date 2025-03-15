//=========create this file for orgnized code.  you can run index.js file also===========//
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key";
const multer = require("multer");
const path = require("path");
const { log } = require("console");
const fs = require("fs");
require("dotenv").config(); // Load environment variables
const authRoutes=require('./Routes/authRoutes');
const AdminRouters=require('./Routes/AdminRoutes');

const app = express();
app.use(cors());
app.use(express.json());
const PORT=process.env.PORT||5000;

app.use(authRoutes)
app.use(AdminRouters)

app.listen(PORT, () => console.log("Server running on port 5000"));