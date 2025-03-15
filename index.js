///===========this file hard to read use [server.js] file.but both file running correctly [index.js and server.js] ========//
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_secret_key";
const multer = require("multer");
const path = require("path");
const { log } = require("console");
const fs = require("fs");


const app = express();
app.use(cors());
app.use(express.json());

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "admin";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "authentication"
});

db.connect(err => {
    if (err) console.log(err);
    else console.log("MySQL Connected...");
});

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

app.get("/new", (req, res) => {
    db.query("SELECT * FROM usertable", (err, result) => {
        if (err) res.send(err);
        else res.json(result);
    });
});
app.get("/users", (req, res) => {
    db.query("SELECT * FROM usertable", (err, result) => {
        if (err) {
            res.status(500).json({ message: "Database error", error: err });
        } else {
            res.json(result); // ✅ Send data as JSON
        }
    });
});
//get user by id
app.get("/getuser/:id", (req, res) => {
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
//delete user
app.delete("/users/:id", (req, res) => {

    const { id } = req.params;
    db.query("DELETE FROM usertable WHERE id = ?", [id], (err, result) => {
        if (err) res.send(err);
        else res.json({ message: "User deleted successfully" });
    });
});

//update` user
app.put("/users/:id", (req, res) => {
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





app.post("/users", (req, res) => {
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

//login
// app.post("/login", (req, res) => {    //Accepts user credentials (email, password) from the request body.
//     const { email, password } = req.body;  //Retrieves email and password from the request sent by the frontend.
//     console.log("email", email)
//     console.log("password", password)
//     const sql = "SELECT * FROM usertable WHERE email = ? AND password = ?";

//     db.query(sql, [email, password], (err, result) => {
//         console.log("result", result)
//         console.log("err", err)
//         if (err) {
//             return res.status(500).json({ message: "Database error" });
//         }
//         if (result.length > 0) {
//             // ✅ Generate token before sending response
//             const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

//             return res.json({ message: "Login successful", user: result[0], token });
//             }
//         return res.status(401).json({ message: "Invalid email or password" });

//     });
// });
app.post("/login", (req, res) => {
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


// app.post("/update",(req,res)=>{
//     const {title,descAboutus,image}=req.body;
//     // console.log("data",aboutus)
//     const sql="insert into aboutdescription (title,description,image) values (?,?,?)";
//     db.query(sql,[title,descAboutus,image],(err,result)=>{
//         if(err){
//             res.send(err);
//         }else{
//             res.json({message:"data inserted successfully"})
//         }
//     })
// })

app.post("/update", upload.single("image"), (req, res) => {
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
// const storage = multer.diskStorage({
//     destination: "./uploads", // Folder where images will be stored
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
//     },
// });
// const upload = multer({ storage });

// // Route to handle file upload
// app.post("/logo", upload.single("logo"), (req, res) => {
//     console.log("Uploaded File:", req.file);

//     if (!req.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//     }

//     const imageData = req.file.buffer; // Get binary data
//     const sql = "INSERT INTO logotable (logoimage) VALUES (?)";

//     db.query(sql, [imageData], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json({ message: "Logo inserted successfully" });
//     });
// });


// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit




app.post("/logo", upload.single("logo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded File:", req.file);
    console.log("Buffer Size:", req.file.buffer.length);

    const imageData = req.file.buffer; // Get binary data
    const altName = req.body.altName || "logo";
    const sql = "INSERT INTO logotable (logoimage,altername) VALUES (?,?)";

    db.query(sql, [imageData, altName], (err, result) => {
        if (err) {
            console.error("Error inserting image:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Logo inserted successfully" });
    });
});



// app.post("/carousel", upload.array("carousel", 4), (req, res) => {
//     if (req.files.length === 0) {
//         return res.status(400).json({ error: "No files uploaded" });
//     }

//     // Convert file paths to JSON format
//     const images = req.files.map(file => "/uploads/" + file.filename);
//     const imagesJson = JSON.stringify(images); // Convert array to JSON string

//     const sql = "INSERT INTO carousel  (image) VALUES (?)";  // Single column
//     db.query(sql, [imagesJson], (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json({ message: "Carousel images inserted successfully" });
//     });
// });

app.post("/carousel", uploadDisk.array("carousel", 4), (req, res) => {
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




// app.get("/lastrecord", (req, res) => {
//     const sql = "SELECT * FROM aboutdescription ORDER BY id DESC LIMIT 1";


//     db.query(sql, (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(result[0]);
//     });
// });

app.get("/lastrecord", (req, res) => {
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


// Fetch Image API
app.get("/fetchLogo", (req, res) => {
    const sql = "SELECT logoimage FROM logotable ORDER BY id DESC LIMIT 1";

    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.length > 0 && result[0].logoimage) {
            res.setHeader("Content-Type", "image/png");
            res.send(result[0].logoimage);
        } else {
            res.status(404).json({ error: "No logo found" });
        }
    });
});



// app.get("/fetchCarouselImages",(req,res)=>{
//     const sql="select  * from carousel order by id desc limit 1";
//     db.query(sql,(err,result)=>{
//         if(err){
//             res.send(err);
//         }else{
//             res.json(result[0]);
//         }
//     })
// })

app.get("/carousel", (req, res) => {
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


// app.get("/fetchCarouselImages", (req, res) => {
//     const sql = "SELECT * FROM carousel ORDER BY id DESC LIMIT 1";

//     db.query(sql, (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }

//         if (result.length > 0) {
//             const imagePath = path.join(__dirname, "public", result[0].image); // Adjust path if needed

//             fs.stat(imagePath, (err, stats) => {
//                 if (err) {
//                     return res.status(500).json({ error: "Error retrieving file size" });
//                 }

//                 res.json({ image: result[0].image, size: stats.size }); // Send file size
//             });
//         } else {
//             res.json({ error: "No image found" });
//         }
//     });
// });

// app.get("/fetchCarouselImages", (req, res) => {
//     const imagePath = "./uploads/your-image.webp"; // Adjust path
//     fs.stat(imagePath, (err, stats) => {
//       if (err) {
//         console.error("Error reading file size:", err);
//         return res.status(500).json({ error: "File not found" });
//       }
//       console.log("Actual image size:", stats.size);
//       res.json({ image: [imagePath], size: stats.size });
//     });
//   });

// app.get("/fetchCarouselImages", (req, res) => {
//     const sql = "SELECT image FROM carousel ORDER BY id DESC";

//     db.query(sql, (err, result) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }

//         // Map the result to extract only the image column
//         const images = result.map(row => row.image);
//         res.json({ images }); // Send as an array
//     });
// });


// app.get("/fetchLogo", (req, res) => {

//     const sql = "SELECT logoimage FROM logotable ORDER BY id DESC LIMIT 1";


//     db.query(sql, (err, result) => {
//         if (err) return res.status(500).json({ error: err.message });


//         if (result.length > 0 && result[0].logoimage) {
//             res.setHeader("Content-Type", "image/png"); // Set correct format
//             res.send(result[0].logoimage); // Send binary image data
//         } else {
//             res.status(404).json({ error: "No logo found" });
//         }
//     });
// });


app.use('/uploads', express.static('uploads'));



app.listen(5000, () => console.log("Server running on port 5000"));
