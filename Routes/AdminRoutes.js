//connected to server.js

const express = require("express")
const mysql = require("mysql")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
require("dotenv").config(); // Load environment variables
const db = require('../db')

//update` user 
//===========update the user through admin panel===========//
router.put("/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    console.log("update email", email);
    console.log("update password", password);

    // Fetch the current user details from the database
    const getUserSql = "SELECT * FROM usertable WHERE id = ?";
    db.query(getUserSql, [id], (err, userResult) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (userResult.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingUser = userResult[0];
        const newPassword = password ? password : existingUser.password; // Keep old password if not provided

        // If the email is not changed, update only username and password
        if (email === existingUser.email) {
            db.query(
                "UPDATE usertable SET password=?, username=? WHERE id=?",
                [newPassword, username, id],
                (err, updateResult) => {
                    if (err) {
                        return res.status(500).json({ error: "Database error" });
                    }
                    return res.json({ message: "User updated successfully" });
                }
            );
        } else {
            // If email is changed, check for uniqueness
            if (email === ADMIN_EMAIL) {
                return res.status(401).json({ message: "Email already used" });
            }

            const checkUserSql = "SELECT * FROM usertable WHERE email = ?";
            db.query(checkUserSql, [email], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                } else if (result.length > 0) {
                    return res.status(400).json({ message: "User already exists" });
                } else {
                    db.query(
                        "UPDATE usertable SET password=?, username=?, email=? WHERE id=?",
                        [newPassword, username, email, id],
                        (err, updateResult) => {
                            if (err) {
                                return res.status(500).json({ error: "Database error" });
                            }
                            return res.json({ message: "User updated successfully" });
                        }
                    );
                }
            });
        }
    });
});


//delete user
//=================delete user admin panel============//
router.delete("/users/:id", (req, res) => {

    const { id } = req.params;
    db.query("DELETE FROM usertable WHERE id = ?", [id], (err, result) => {
        if (err) res.send(err);
        else res.json({ message: "User deleted successfully" });
    });
});

//
router.get("/new", (req, res) => {
    db.query("SELECT * FROM usertable", (err, result) => {
        if (err) res.send(err);
        else res.json(result);
    });
});
router.get("/users", (req, res) => {
    db.query("SELECT * FROM usertable", (err, result) => {
        if (err) {
            res.status(500).json({ message: "Database error", error: err });
        } else {
            res.json(result); // ✅ Send data as JSON
        }
    });
});
//get user by id
router.get("/getuser/:id", (req, res) => {
    const { id } = req.params;
    console.log("id", id);
    db.query("SELECT * FROM usertable WHERE id = ?", [id], (err, result) => {
        if (err) {
            res.status(500).json({ message: "Database error", error: err });
        } else {
            res.json(result[0]); // ✅ Send data as JSON
        }
    });

});

//==========================Website ==========================//

const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ✅ Use diskStorage for carousel images
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Ensure "uploads/" folder exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const uploadDisk = multer({ storage: diskStorage, limits: { fileSize: 5 * 1024 * 1024 } });

//update description title and about us image
router.post("/update", upload.single("image"), (req, res) => {
    const { title, descAboutus } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const image = req.file.buffer; // Stores images as binary in MySQL.

    const sql = "INSERT INTO aboutdescription (title, description, image) VALUES (?, ?, ?)";
    db.query(sql, [title, descAboutus, image], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Data inserted successfully" });
    });
});

//get method
router.get("/lastrecord", (req, res) => {
    const sql = "SELECT * FROM aboutdescription ORDER BY id DESC LIMIT 1";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length > 0) {
            let aboutData = result[0];

            // Convert Buffer to Base64
            aboutData.image = `data:image/jpeg;base64,${aboutData.image.toString("base64")}`;

            res.json(aboutData);
        } else {
            res.status(404).json({ error: "No record found" });
        }
    });
});

//update logo and alternate name
router.post("/logo", upload.single("logo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded File:", req.file);
    console.log("Buffer Size:", req.file.buffer.length);

    const imageData = req.file.buffer; // Get binary data
    const altName= req.body.altName || "logo";
    const selectedColor = "bg-blue-300";
    const sql = "INSERT INTO logotable (logoimage,altername,bgcolor) VALUES (?,?,?)";

    db.query(sql, [imageData, altName,selectedColor], (err, result) => {
        if (err) {
            console.error("Error inserting image:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Logo inserted successfully" });
    });
});

// Fetch Image API
// router.get("/fetchLogo", (req, res) => {
//     // const sql = "SELECT logoimage FROM logotable ORDER BY id DESC LIMIT 1";
//     const sql = "SELECT logoimage, altername, bgcolor FROM logotable ORDER BY id DESC LIMIT 1";


//     db.query(sql, (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }

//         if (result.length > 0 && result[0].logoimage) {
//             res.setHeader("Content-Type", "image/png");
//             res.send({
//                 altName: result[0].altername,
//                 selectedColor: result[0].bgcolor,
//                 image:result[0].logoimage});
//         } else {
//             res.status(404).json({ error: "No logo found" });
//         }
//     });
// });
router.get("/fetchLogo", (req, res) => {
    const sql = "SELECT logoimage, altername FROM logotable ORDER BY id DESC LIMIT 1";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length > 0) {
            res.json({
                altName: result[0].altername,
                selectedColor: result[0].bgcolor,
                image: `data:image/png;base64,${result[0].logoimage.toString("base64")}` // ✅ Convert binary image to Base64
            });
        } else {
            res.status(404).json({ error: "No logo found" });
        }
    });
});


//update crousel image

router.post("/carousel", uploadDisk.array("carousel", 4), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }
    console.log("carousel images ", req);
    const images = req.files.map(file => "/uploads/" + file.filename);
    const imagesJson = JSON.stringify(images);

    const sql = "INSERT INTO carousel (image) VALUES (?)";
    db.query(sql, [imagesJson], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Carousel images inserted successfully" });
    });
});
//get method for upate the website 
router.get("/carousel", (req, res) => {
    const sql = "SELECT image FROM carousel ORDER BY id DESC LIMIT 1"; // Get the last record

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "No records found" });
        }

        const images = JSON.parse(result[0].image); // Parse the stored JSON string
        res.json({ images });
    });
});

// API to update color
// router.post("/updateColor", (req, res) => {
//     const { color } = req.body;
//     const sql = "UPDATE bgcolor SET bgcolor = ? WHERE id = 1"; // Update color in row with ID 1

//     db.query(sql, [color], (err, result) => {
//         if (err) {
//             console.error("Error updating color:", err);
//             res.status(500).json({ error: "Database error" });
//         } else {
//             if (result.affectedRows > 0) {
//                 res.status(200).json({ message: "Color updated successfully", color});
//             } else {
//                 res.status(404).json({ message: "No color record found" });
//             }
//         }
//     });
// });

//update color from rightside bar
router.post("/updateColor", (req, res) => {
    const { bgcolor, headercolor, sidebarcolor,footercolor } = req.body;

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
    if (sidebarcolor) {
        updates.push("sidebarcolor = ?");
        values.push(sidebarcolor);
    }
    if(footercolor){
        updates.push("footercolor=?")
        values.push(footercolor);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No valid color fields provided" });
    }

    const sql = `UPDATE bgcolor SET ${updates.join(", ")} WHERE id = 1`;

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating color:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.status(200).json({ message: "Color updated successfully" });
        }
    });
});


// router.get("/getColor", (req, res) => {
//     const sql = "SELECT bgcolor FROM bgcolor WHERE id = 1";

//     db.query(sql, (err, result) => {
//         if (err) {
//             console.error("Error fetching color:", err);
//             res.status(500).json({ error: "Database error" });
//         } else if (result.length > 0) {
//             res.status(200).json({ color: result[0].bgcolor });
//         } else {
//             res.status(404).json({ message: "No color found" });
//         }
//     });
// });
router.get("/getColors", (req, res) => {
    const sql = "SELECT bgcolor, headercolor, sidebarcolor,footercolor FROM bgcolor WHERE id = 1";

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching colors:", err);
            res.status(500).json({ error: "Database error" });
        } else {
            if (result.length > 0) {
                res.status(200).json(result[0]); // Sending the first row as JSON
            } else {
                res.status(404).json({ message: "No color record found" });
            }
        }
    });
});
/// service method
router.post("/service",(req,res)=>{
    const{title}=req.body
    console.log(title)
    const sql="UPDATE services SET title = ? WHERE id = 1"
    db.query(sql,[title],(err,result)=>{
        if(err){
            console.log("error")
           return res.status(500).json({erro:"database error"});
        }
        return res.json({message:"data inserted successfully"});
    })
})

router.get("/service/:id", (req, res) => {
    const { id } = req.params; // Get ID from request params
    const sql = "SELECT * FROM services WHERE id = ?"; // SQL Query

    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ message: "Error fetching service" });
        } else {
            if (result.length > 0) {
                res.json(result[0]); // Send service details as response
            } else {
                res.status(404).json({ message: "Service not found" });
            }
        }
    });
});
router.use('/uploads', express.static('uploads'));

module.exports = router;