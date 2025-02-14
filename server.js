const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); 
const https = require("https");
const db = require("./config/db"); // Database connection
const authRoutes = require("./routes/authRoutes"); // Authentication routes
const apiEndPointsRoutes = require("./routes/apiEndPointsRoutes"); // Authentication routes
const moduleRoutes = require("./routes/moduleRoutes"); // Authentication routes
const permissionRoutes = require("./routes/permissionRoutes"); // Authentication routes
const authMiddleware = require("./middleware/authMiddleWare"); // Middleware to protect routes
const { sendMail } = require("./config/mail"); // Mail service
require("dotenv").config(); // Load environment variables

const app = express();

app.use(cors()); 
app.use(bodyParser.json());


// Authentication Routes
app.use("/auth", authRoutes);
app.use("/api", apiEndPointsRoutes,moduleRoutes,permissionRoutes);

app.get("/get-last-req",authMiddleware, (req, res) => {
    const dbConnection = db; 

    // Fetch the last reqMasId from the table
    const fetchLastReqFormIdQuery = `SELECT MAX(reqId) AS lastReqFormId FROM owsReqForm`;

    dbConnection.query(fetchLastReqFormIdQuery, (fetchErr, fetchResult) => {
        if (fetchErr) {
            console.error("Failed to fetch the last reqMasId:", fetchErr);
            return res.status(500).send({
                error: "Failed to fetch the last reqMasId",
                details: fetchErr,
            });
        }

        const lastReqFormId = fetchResult[0].lastReqFormId || 0; // Default to 0 if no rows exist
        const nextReqFormId = lastReqFormId + 1; // Increment by 1

        console.log("Next reqMasId:", nextReqFormId);

        // Send the nextReqMasId back to the client
        res.status(200).send({ nextReqFormId });
    });
});

app.post("/add-request",authMiddleware, (req, res) => {
    const data = req.body;

    const owsReqMasQuery = `
        INSERT IGNORE INTO owsReqMas (
    reqMasId, reqDt, ITS, name, fullName, mohalla, address, dob, email, mobile, whatsapp
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const owsReqFormQuery = `
        INSERT INTO owsReqForm (
            reqId, ITS, reqByITS, reqByName, city, institution, class_degree, 
            fieldOfStudy, subject_course, yearOfStart, grade, email, contactNo, 
            whatsappNo, purpose, fundAsking, classification, organization, 
            description, currentStatus, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const dbConnection = db; 

    dbConnection.beginTransaction((err) => {
        if (err) {
            console.error("Transaction failed to start:", err);
            return res.status(500).send({ error: "Transaction failed to start", details: err });
        }

        // Fetch the last reqMasId from the table
        const fetchLastReqMasIdQuery = `SELECT MAX(reqMasId) AS lastReqMasId FROM owsReqMas`;

        dbConnection.query(fetchLastReqMasIdQuery, (fetchErr, fetchResult) => {
            if (fetchErr) {
                console.error("Failed to fetch the last reqMasId:", fetchErr);
                return dbConnection.rollback(() => {
                    res.status(500).send({ error: "Failed to fetch the last reqMasId", details: fetchErr });
                });
            }

            const lastReqMasId = fetchResult[0].lastReqMasId || 0; // Default to 0 if no rows exist
            const nextReqMasId = lastReqMasId + 1; // Increment by 1

            // Insert into owsReqMas
            const reqMasValues = [
                nextReqMasId,
                new Date().toISOString().slice(0, 19).replace("T", " "), // Current timestamp for reqDt
                data.memberITS,
                data.firstName || null,
                data.fullName,
                data.mohalla || null,
                data.address || null,
                data.dob || null,
                data.email || null,
                data.phoneNumber || null,
                data.whatsappNumber || null,
            ];

            dbConnection.query(owsReqMasQuery, reqMasValues, (masErr, masResult) => {
                if (masErr) {
                    console.error("Failed to insert data into owsReqMas:", masErr);
                    return dbConnection.rollback(() => {
                        res.status(500).send({ error: "Failed to insert data into owsReqMas", details: masErr });
                    });
                }

                const fetchLastReqFormIdQuery = `SELECT MAX(reqId) AS lastReqFormId FROM owsReqForm`;


                dbConnection.query(fetchLastReqFormIdQuery, (fetchErr, fetchResult) => {
                    if (fetchErr) {
                        console.error("Failed to fetch the last reqMasId:", fetchErr);
                        return res.status(500).send({
                            error: "Failed to fetch the last reqMasId",
                            details: fetchErr,
                        });
                    }

                    const lastReqFormId = fetchResult[0].lastReqFormId || 0; // Default to 0 if no rows exist
                    const nextReqFormId = lastReqFormId + 1; // Increment by 1

                    const reqFormValues = [
                        nextReqFormId, 
                        data.memberITS,
                        data.appliedbyIts,
                        data.appliedbyName, 
                        data.city,
                        data.institution,
                        data.classDegree,
                        data.study,
                        data.subject,
                        data.year,
                        null, 
                        data.email,
                        data.phoneNumber,
                        data.whatsappNumber,
                        "Education Assistance", 
                        data.fundAmount,
                        "Education", 
                        null, 
                        data.fundDescription,
                        "Pending", 
                        data.appliedby, 
                    ];

                    dbConnection.query(owsReqFormQuery, reqFormValues, (formErr, formResult) => {
                        if (formErr) {
                            console.error("Failed to insert data into owsReqForm:", formErr);
                            return dbConnection.rollback(() => {
                                res.status(500).send({ error: "Failed to insert data into owsReqForm", details: formErr });
                            });
                        }
                    });

                    // Commit the transaction
                    dbConnection.commit((commitErr) => {
                        if (commitErr) {
                            console.error("Failed to commit transaction:", commitErr);
                            return dbConnection.rollback(() => {
                                res.status(500).send({ error: "Failed to commit transaction", details: commitErr });
                            });
                        }

                        console.log("Data inserted successfully");

                        res.send({ message: "Data inserted successfully", reqMasId: nextReqMasId });
                    });
                });
            });
        });
    });
});

app.get("/get-requests", (req, res) => {
    const id = req.query.id;
    let query = "SELECT * FROM owsReqForm";

    if (id) {
        query += " WHERE id = ?";
    }

    db.query(query, id ? [id] : [], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

app.get('/fetch-image', async (req, res) => {
    try {
        const { url } = req.query;

        // Validate the URL
        if (!url) {
            return res.status(400).send('Image URL is required');
        }

        // Fetch the image
        const response = await axios.get(url, { responseType: 'arraybuffer' });

        // Set the appropriate headers
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Length', response.headers['content-length']);

        // Send the image buffer
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching image:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});

// Endpoint to fetch profile data
app.get("/get-profile/:itsId", async (req, res) => {
    const itsId = req.params.itsId;

    // URL with dynamic `itsId`
    const url = `https://paktalim.com/admin/ws_app/GetProfileEducation/${itsId}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data" });
    }
});

// Endpoint to fetch family profile data
app.get("/get-family-profile/:itsId", async (req, res) => {
    const itsId = req.params.itsId;

    // URL with dynamic `itsId`
    const url = `https://paktalim.com/admin/ws_app/GetProfileFamily/${itsId}?access_key=c197364bbcef92456a31b1773941964a728e2c33&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        if (response.data) {
            console.log(response.data);
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ message: "Family profile not found." });
        }
    } catch (error) {
        console.error("Error fetching family profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch family profile data" });
    }
});

app.get('/fetch-pdf1',authMiddleware, (req, res) => {
    try {
        // Path to the static PDF file
        const pdfPath = '/Users/abiali/Desktop/ows_node/profile.pdf';

        console.log("HERE");
        console.log(pdfPath);

        const pdfData = fs.readFileSync(pdfPath);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="profile.pdf"');

        // Send the PDF byte data directly
        res.send(pdfData);
    } catch (error) {
        console.error('Error reading the PDF file:', error.message);
        res.status(500).json({ error: 'Failed to send PDF file' });
    }
});

app.get('/fetch-pdf:its', async (req, res) => {

    const its = req.params.its
    try {
        const pdfUrl = `https://paktalim.com/admin/ws_app/GetProfilePDF/${its}?access_key=2f1d0195f15f9e527665b4a87e958586a4da8de1&username=40459629`;

        console.log("Fetching PDF from URL:", pdfUrl);

        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="profile.pdf"');

        res.send(response.data);
    } catch (error) {
        console.error('Error fetching the PDF file:', error.message);
        res.status(500).json({ error: 'Failed to fetch PDF file' });
    }
});

// API Route to Send Email
app.post("/send-email", async (req, res) => {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const response = await sendMail(to, subject, text, html);

    if (response.success) {
        res.status(200).json(response);
    } else {
        res.status(500).json(response);
    }
});

app.post("/check-its-id", async (req, res) => {
    const { ITS_ID } = req.body;

    if (!ITS_ID) {
        return res.status(400).json({ error: "ITS_ID is required" });
    }

    // Query user role based on ITS_ID
    db.query("SELECT role_id FROM users WHERE ITS_ID = ?", [ITS_ID], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }

        // If ITS_ID exists, return the role
        if (result.length > 0) {
            const role_id = result[0].role_id;

            // Fetch role details from the roles table
            db.query("SELECT role_name, permissions FROM roles WHERE id = ?", [role_id], (roleErr, roleResult) => {
                if (roleErr || roleResult.length === 0) {
                    return res.status(500).json({ error: "Role not found" });
                }

                const role = roleResult[0];
                return res.json({ ITS_ID, role: role.role_name, permissions: JSON.parse(role.permissions) });
            });

        } else {
            // If ITS_ID does not exist, return default role ITS_ID=0
            return res.json({ ITS_ID: 0, role: "guest", permissions: { "view_dashboard": true } });
        }
    });
});

app.get("/user-permissions", authMiddleware, async (req, res) => {
    try {
        const { its_id, role } = req.user; 

        // Fetch user features & modules
        const [permissions] = await db.promise().query(`
            SELECT f.id AS feature_id, f.feature_name, m.id AS module_id, m.module_name 
            FROM permissions up
            JOIN features f ON up.feature_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE up.its_id = ?
        `, [its_id]);

        res.json({ its_id, role, permissions });
    } catch (error) {
        console.error("Error fetching permissions:", error);
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
});

app.get("/proxy",authMiddleware, async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: "URL parameter is required" });
        }

        // Validate URL
        if (!/^https?:\/\//i.test(url)) {
            return res.status(400).json({ error: "Invalid URL format" });
        }

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoint to execute SQL commands
app.post("/execute",authMiddleware, async (req, res) => {
    const { query } = req.body;
  
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Invalid or missing SQL query." });
    }
  
    try {
      db.query(query, (error, results) => {
        if (error) {
          console.error("SQL Error:", error.message);
          return res.status(400).json({ error: error.sqlMessage || "Query execution failed" });
        }
        res.json({ success: true, results });
      });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  });

// Load SSL Certificates
const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/fullchain.pem"),
};

// Start HTTPS Server
const PORT = 3002;
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://mode.imadiinnovations.com:${PORT}`);
});
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));