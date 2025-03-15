//this for not yet used just for implementation of mvc

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

