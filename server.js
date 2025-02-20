const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); 
const https = require("https");
const db = require("./config/db"); 
const authRoutes = require("./routes/authRoutes"); 
const userRoutes = require("./routes/userRoutes"); 
const moduleRoutes = require("./routes/moduleRoutes"); 
const permissionRoutes = require("./routes/permissionRoutes"); 
const authMiddleware = require("./middleware/authMiddleWare"); 
const sendMail = require("./config/mail"); 
require("dotenv").config(); 
const OwsReqForm = require("./models/owsReqForm.model"); 
//const fetchViaProxy = require("./proxy"); 

const app = express();

app.use(cors()); 
app.use(bodyParser.json());


// Authentication Routes
app.use("/auth", authRoutes);
app.use("/",moduleRoutes,permissionRoutes,userRoutes);

app.get("/get-last-req", authMiddleware, async (req, res) => {
    try {
        // Fetch the last reqId using Sequelize ORM
        const lastReq = await OwsReqForm.findOne({
            attributes: ["reqId"],
            order: [["reqId", "DESC"]], // Order by descending reqId
        });

        // If no records exist, start from 1
        const lastReqFormId = lastReq ? lastReq.reqId : 0;
        const nextReqFormId = lastReqFormId + 1; // Increment by 1

        console.log("Next reqId:", nextReqFormId);

        return res.status(200).json({ nextReqFormId });

    } catch (error) {
        console.error("Failed to fetch last reqId:", error);
        return res.status(500).json({
            error: "Failed to fetch last reqId",
            details: error.message,
        });
    }
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

app.post("/get-profile", authMiddleware, async (req, res) => {
    try {
        const { its_id } = req.body;

        // ✅ Validate input
        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        console.log("Fetching profile for ITS ID:", its_id);

        // URL with dynamic `its_id`
        const url = `https://paktalim.com/admin/ws_app/GetProfileEducation/${its_id}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;
        // Fetch profile data
        //const response = await fetchViaProxy(url);
        const response = await axios.get(url);

        return res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching profile data:", error.message);

        if (error.response) {
            return res.status(error.response.status).json({ error: "Failed to fetch profile data", details: error.response.data });
        }

        return res.status(500).json({ error: "Server error", details: error.message });
    }
});


// NEW FAMILY API
app.post("/get-family-profile", authMiddleware, async (req, res) => {
    try {
        const { its_id } = req.body;

        // ✅ Validate input
        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        console.log("Fetching family profile for ITS ID:", its_id);
        const url = `http://182.188.38.224:8083/crc_live/backend/dist/mumineen/getFamilyDetails.php?user_name=umoor_talimiyah&password=UTalim2025&token=0a1d240f3f39c454e22b2402303aa2959d00b770d9802ed359d75cf07d2e2b65&its_id=${its_id}`;
        //const url1 = "http://182.188.38.224:8083/crc_live/backend/dist/mumineen/getFamilyDetails.php?user_name=umoor_talimiyah&password=UTalim2025&token=0a1d240f3f39c454e22b2402303aa2959d00b770d9802ed359d75cf07d2e2b65&its_id=30475507";
        // Fetch family data
        //const response = await fetchViaProxy(url1);
        const response = await axios.get(url);
        return res.status(200).json(response);

    } catch (error) {
        console.error("Error fetching family data:", error.message);

        if (error.response) {
            return res.status(error.response.status).json({ error: "Failed to fetch family data", details: error.response.data });
        }

        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Endpoint to fetch family profile data
app.post("/get-family-profile-old",authMiddleware, async (req, res) => {
    const { itsId } = req.body;

    const url = `https://paktalim.com/admin/ws_app/GetProfileFamily/${itsId}?access_key=c197364bbcef92456a31b1773941964a728e2c33&username=40459629&password=1107865253`;

    try {
        const response = await axios.get(url);
        if (response.data) {
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ message: "Family profile not found." });
        }
    } catch (error) {
        console.error("Error fetching family profile data:", error.message);
        res.status(500).json({ error: "Failed to fetch family profile data" });
    }
});

app.post("/fetch-pdf", authMiddleware, async (req, res) => {
    try {
        const { its } = req.body;

        // ✅ Validate input
        if (!its) {
            return res.status(400).json({ error: "Missing 'its' in request body" });
        }
        if (typeof its !== "string" || its.trim().length === 0) {
            return res.status(400).json({ error: "'its' must be a non-empty string" });
        }

        // ✅ Construct the PDF URL
        const pdfUrl = `https://paktalim.com/admin/ws_app/GetProfilePDF/${its}?access_key=2f1d0195f15f9e527665b4a87e958586a4da8de1&username=40459629`;

        console.log("Fetching PDF from URL:", pdfUrl);

        // ✅ Fetch the PDF as a binary array
        const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });

        // ✅ Set headers for PDF response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="profile.pdf"');

        // ✅ Send the PDF file
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching the PDF file:", error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                error: "Failed to fetch PDF file",
                details: error.response.data,
            });
        }

        res.status(500).json({ error: "Server error", details: error.message });
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

app.get("/get-url",authMiddleware, async (req, res) => {
    //console.log("HERE");
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
        console.log("error");
        res.status(500).json({ error: error.message });
    }
});

// Load SSL Certificates
// const options = {
//     key: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/privkey.pem"),
//     cert: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/fullchain.pem"),
// };

// Start HTTPS Server
const PORT = 3002;
// https.createServer(options, app).listen(PORT, () => {
//     console.log(`HTTPS Server running on https://mode.imadiinnovations.com:${PORT}`);
// });
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));