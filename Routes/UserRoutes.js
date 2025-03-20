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
router.use(express.json());

// router.post("/themecolor", (req, res) => {
//     const { userId, headercolor,footercolor,bgcolor } = req.body;
//     let updates = [];
//     let values = [];

//     if (bgcolor) {
//         updates.push("bgcolor = ?");
//         values.push(bgcolor);
//     }
//     if (headercolor) {
//         updates.push("headercolor = ?");
//         values.push(headercolor);
//     }
//     if (sidebarcolor) {
//         updates.push("footercolor = ?");
//         values.push(footercolor);
//     }

//     if (updates.length === 0) {
//         return res.status(400).json({ error: "No valid color fields provided" });
//     }
//     console.log(userId, headercolor);

//     // Check if the user already exists
//     const checkQuery = "SELECT * FROM usertheme WHERE userId = ?";
//     db.query(checkQuery, [userId], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }

//         if (result.length > 0) {
//             // User exists, update the header color
//             const updateQuery = "UPDATE usertheme SET headercolor = ?,bgcolor=?, WHERE userId = ?";
//             db.query(updateQuery, [headercolor,bgcolor, userId], (err, updateResult) => {
//                 if (err) {
//                     return res.status(500).json({ error: err.message });
//                 }
//                 res.json({ message: "Theme updated successfully" });
//             });
//         } else {
//             // User does not exist, insert new record
//             const insertQuery = "INSERT INTO usertheme (userId, headercolor) VALUES (?, ?)";
//             db.query(insertQuery, [userId, headercolor], (err, insertResult) => {
//                 if (err) {
//                     return res.status(500).json({ error: err.message });
//                 }
//                 res.json({ message: "New theme inserted successfully" });
//             });
//         }
//     });
// });
// router.post("/themecolor", (req, res) => {
//     const { userId, headercolor, footercolor, bgcolor } = req.body;

//     if (!userId) {
//         return res.status(400).json({ error: "userId is required" });
//     }

//     // Check if userId exists in usertheme table
//     const checkQuery = "SELECT * FROM usertheme WHERE userId = ?";
//     db.query(checkQuery, [userId], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }

//         if (result.length > 0) {
//             // User exists → UPDATE the record
//             const updateQuery = `
//                 UPDATE usertheme 
//                 SET 
//                     headercolor = COALESCE(?, headercolor), 
//                     footercolor = COALESCE(?, footercolor), 
//                     bgcolor = COALESCE(?, bgcolor) 
//                 WHERE userId = ?`;

//             db.query(updateQuery, [headercolor, footercolor, bgcolor, userId], (err, updateResult) => {
//                 if (err) {
//                     return res.status(500).json({ error: err.message });
//                 }
//                 res.json({ message: "Theme updated successfully" });
//             });

//         } else {
//             // User does not exist → INSERT new record
//             const insertQuery = `INSERT INTO usertheme (userId, headercolor, footercolor, bgcolor) VALUES (?, ?, ?, ?)`;
//             db.query(insertQuery, [userId, headercolor || null, footercolor || null, bgcolor || null], (err, insertResult) => {
//                 if (err) {
//                     return res.status(500).json({ error: err.message });
//                 }
//                 res.json({ message: "New theme inserted successfully" });
//             });
//         }
//     });
// });

router.post("/usertheme", (req, res) => {
    const { userId, bgcolor, headercolor, footercolor } = req.body;
    console.log(userId);
    console.log(bgcolor)

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    let updates = [];
    let values = [];

    if (bgcolor) {
        updates.push("bgcolor = ?");
        values.push(bgcolor);
    }
    if (headercolor) {
        updates.push("headercolor = ?");
        values.push(headercolor);
    }
    if (footercolor) {
        updates.push("footercolor = ?");
        values.push(footercolor);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No valid color fields provided" });
    }

    // Check if the user already exists
    const checkQuery = "SELECT * FROM usertheme WHERE userId = ?";
    db.query(checkQuery, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        if (result.length > 0) {
            // User exists, update the record
            const updateQuery = `UPDATE usertheme SET ${updates.join(", ")} WHERE userId = ?`;
            db.query(updateQuery, [...values, userId], (err, updateResult) => {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(200).json({ message: "Color updated successfully" });
            });
        } else {
            // User doesn't exist, insert a new record
            const insertQuery = `INSERT INTO usertheme (userId, bgcolor, headercolor, footercolor) VALUES (?, ?, ?, ?)`;
            db.query(insertQuery, [userId, bgcolor || null, headercolor || null, footercolor || null], (err, insertResult) => {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }
                res.status(200).json({ message: "New color record inserted successfully" });
            });
        }
    });
});


router.get("/getuserthemecolor", (req, res) => {
    const { userId } = req.query; // Use `req.query` for GET requests
console.log("userid",userId)
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const sql = "SELECT headercolor, bgcolor, footercolor FROM usertheme WHERE userId = ?";
    
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error fetching user theme color:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {

            return res.status(404).json({ message: "No theme found for this user" });

        }
       return  res.status(200).json(result[0]); // Return only the first result
    });
});



module.exports=router;