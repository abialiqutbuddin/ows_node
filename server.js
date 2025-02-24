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
const OwsReqMas = require("./models/owsReqMas.model");
const User = require("./models/user.model");

const app = express();
const { body, validationResult } = require("express-validator");
const sequelize = require("./config/db");
app.use(cors());
app.use(bodyParser.json());


// Authentication Routes
app.use("/auth", authRoutes);
app.use("/", moduleRoutes, permissionRoutes, userRoutes);

app.get("/get-last-req", authMiddleware, async (req, res) => {
    try {
        const lastReq = await OwsReqForm.findOne({
            attributes: ["reqId"],
            order: [["reqId", "DESC"]],
        });

        const lastReqFormId = lastReq ? lastReq.reqId : 0;
        const nextReqFormId = lastReqFormId + 1;

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

app.post("/add-request", authMiddleware, (req, res) => {
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

app.get('/fetch-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('Image URL is required');
        }

        const response = await axios.get(url, { responseType: 'arraybuffer' });

        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Content-Length', response.headers['content-length']);

        res.send(response.data);
    } catch (error) {
        console.error('Error fetching image:', error.message);
        res.status(500).send('Failed to fetch image');
    }
});

app.post("/get-profile", authMiddleware, async (req, res) => {
    try {
        const { its_id } = req.body;

        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        console.log("Fetching profile for ITS ID:", its_id);

        const url = `https://paktalim.com/admin/ws_app/GetProfileEducation/${its_id}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;
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

        if (!its_id) {
            return res.status(400).json({ error: "Missing 'its_id' in request body" });
        }
        if (typeof its_id !== "string" || its_id.trim().length === 0) {
            return res.status(400).json({ error: "'its_id' must be a non-empty string" });
        }

        const url = `http://192.168.52.58:8080/crc_live/backend/dist/mumineen/getFamilyDetails.php?user_name=umoor_talimiyah&password=UTalim2025&token=0a1d240f3f39c454e22b2402303aa2959d00b770d9802ed359d75cf07d2e2b65&its_id=${its_id}`;
        const response = await axios.get(url);
        return res.status(200).json(response.data);

    } catch (error) {
        console.error("Error fetching family data:", error.message);

        if (error.response) {
            return res.status(error.response.status).json({ error: "Failed to fetch family data", details: error.response.data });
        }

        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Endpoint to fetch family profile data
app.post("/get-family-profile-old", authMiddleware, async (req, res) => {
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

        if (!its) {
            return res.status(400).json({ error: "Missing 'its' in request body" });
        }
        if (typeof its !== "string" || its.trim().length === 0) {
            return res.status(400).json({ error: "'its' must be a non-empty string" });
        }

        const pdfUrl = `https://paktalim.com/admin/ws_app/GetProfilePDF/${its}?access_key=2f1d0195f15f9e527665b4a87e958586a4da8de1&username=40459629`;

        const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="profile.pdf"');

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

//GET FROM URL
app.post("/get-url", authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
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


/////////////////

// ✅ POST: Submit Request Form (With ITS Check)
app.post(
    "/submit-request-form",
    [
        body("ITS").isLength({ min: 8, max: 8 }).withMessage("ITS must be 8 characters."),
        body("reqByITS").isLength({ min: 8, max: 8 }).withMessage("Requestor ITS must be 8 characters."),
        body("reqByName").notEmpty().withMessage("Requestor name is required."),
        body("email").optional().isEmail().withMessage("Invalid email format."),
        body("fundAsking").optional().isFloat({ min: 0 }).withMessage("Fund must be a positive number."),
        body("organization").notEmpty().withMessage("Organization is required."), // ✅ Ensure organization is not empty
    ],
    async (req, res) => {
        console.log("📥 Incoming Request Data:", req.body);

        // ❌ Handle Validation Errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("❌ Validation Errors:", errors.array());
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const transaction = await OwsReqMas.sequelize.transaction();

        try {
            const {
                ITS, reqByITS, reqByName, city, institution, class_degree, fieldOfStudy, subject_course,
                yearOfStart, grade, email, contactNo, whatsappNo, purpose, fundAsking, classification,
                organization, description, currentStatus, created_by, updated_by, mohalla, address, dob
            } = req.body;

            console.log(`🔎 Checking if ITS (${ITS}) exists in owsReqMas...`);
            let existingUser = await OwsReqMas.findOne({ where: { ITS }, transaction });

            // ✅ Step 2: If ITS not found, insert into `owsReqMas`
            if (!existingUser) {
                console.log(`⚠️ ITS (${ITS}) not found! Inserting into owsReqMas...`);

                existingUser = await OwsReqMas.create(
                    {
                        ITS,
                        name: reqByName,
                        fullName: reqByName,
                        email,
                        mobile: contactNo,
                        whatsapp: whatsappNo,
                        address: address, // Default empty, modify if needed
                        mohalla: mohalla, // Default empty
                        dob: dob, // Default null
                        reqDt: new Date(), // Request Date
                    },
                    { transaction }
                );

                console.log("✅ ITS inserted into owsReqMas successfully:", existingUser.toJSON());
            } else {
                console.log("✅ ITS already exists in owsReqMas:", existingUser.toJSON());
            }

            // ✅ Step 3: Insert into `owsReqForm`
            console.log(`📌 Inserting request form for ITS: ${ITS}...`);
            const newRequest = await OwsReqForm.create(
                {
                    ITS,
                    reqByITS,
                    reqByName,
                    city,
                    institution,
                    class_degree,
                    fieldOfStudy,
                    subject_course,
                    yearOfStart,
                    grade,
                    email,
                    contactNo,
                    whatsappNo,
                    purpose,
                    fundAsking,
                    classification,
                    organization,
                    description,
                    currentStatus,
                    created_by,
                    updated_by,
                    mohalla,
                },
                { transaction }
            );

            await transaction.commit();

            return res.status(201).json({
                success: true,
                message: "Request Form submitted successfully.",
                data: newRequest,
            });

        } catch (error) {
            await transaction.rollback();
            console.error("🚨 Error submitting request form:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    }
);

app.post("/users-by-mohalla", async (req, res) => {
    try {
        const { mohalla } = req.body;

        if (!mohalla) {
            return res.status(400).json({
                success: false,
                message: "Mohalla name is required",
            });
        }

        const users = await OwsReqForm.findAll({
            where: { mohalla },
        });

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No users found for the specified Mohalla",
            });
        }

        return res.status(200).json({
            success: true,
            data: users,
        });

    } catch (error) {
        console.error("Error fetching users by Mohalla:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

const validStatuses = [
    "Request Generated",
    "Request Received",
    "Request Denied",
    "Request Pending",
    "Request Approved",
    "Application Applied",
    "Application Denied",
    "Application Pending",
    "Application Approved",
    "Payment in Process",
    "First Payment Done"
];

// ✅ API: Update Request Status (POST)
app.post("/update-request-status", authMiddleware, async (req, res) => {
    try {
        console.log("HERE");
        const { reqId, newStatus } = req.body;

        // ❌ Validate input
        if (!reqId || !newStatus) {
            return res.status(400).json({
                success: false,
                message: "Request ID and new status are required",
            });
        }

        // ❌ Validate status
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Allowed values are: " + validStatuses.join(", "),
            });
        }

        // ✅ Find the request by ID
        const request = await OwsReqForm.findOne({ where: { reqId } });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        // ✅ Update status
        request.currentStatus = newStatus;
        await request.save();

        return res.status(200).json({
            success: true,
            message: `Request status updated to '${newStatus}' successfully.`,
            data: request,
        });

    } catch (error) {
        console.error("Error updating request status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

app.post("/all-requests", authMiddleware, async (req, res) => {
    try {
        const requests = await OwsReqForm.findAll();

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No requests found",
            });
        }

        return res.status(200).json({
            success: true,
            data: requests,
        });

    } catch (error) {
        console.error("Error fetching all requests:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

app.post("/requests-by-organization", authMiddleware, async (req, res) => {
    try {
        const { organization } = req.body;

        if (!organization) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required",
            });
        }

        const requests = await OwsReqForm.findAll({
            where: { organization },
        });

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No requests found for the specified organization",
            });
        }

        return res.status(200).json({
            success: true,
            data: requests,
        });

    } catch (error) {
        console.error("Error fetching requests by organization:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

app.post("/run-query", authMiddleware, async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, message: "SQL query is required" });
    }

    try {
        console.log(`Executing SQL Query: ${query}`);
        const results = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

        return res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error("Error executing SQL query:", error);
        return res.status(500).json({ success: false, message: "Database query failed", error: error.message });
    }
});