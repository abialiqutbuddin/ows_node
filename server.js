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
const AiutRecord = require("./models/aiut_record.model");
const AmbtRecord = require("./models/ambt_record.model");
const StsmfRecord = require("./models/stsmf_record.model");
const User = require("./models/user.model");
const multer = require('multer');
const path = require('path');
const app = express();
const { body, validationResult } = require("express-validator");
const sequelize = require("./config/db");
app.use(cors());
app.use(bodyParser.json());

const API_VERSION = "1.1.3"; // Change this based on your version

const PORT = 3002;

//Load SSL Certificates
const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/mode.imadiinnovations.com/fullchain.pem"),
};
// Start HTTPS Server
https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://mode.imadiinnovations.com:${PORT}`);
});
//app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//const uploadRoutes = require("./utils/upload");
//app.use("/upload", uploadRoutes);

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
                ITS, studentFirstName,studentFullName, reqByITS, reqByName, city, institution, class_degree, fieldOfStudy, subject_course,
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
                        name: studentFirstName,
                        fullName: studentFullName,
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
                    currentStatus: "Request Generated",
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
        const { mohalla, org, userRole, ITS } = req.body; // Extract ITS for user filtering

        if (!userRole) {
            return res.status(400).json({
                success: false,
                message: "User role is required",
            });
        }

        let users;

        if (userRole === "admin") {
            // ✅ Admins: Fetch all requests
            console.log("Admin: Fetching all requests...");
            users = await OwsReqForm.findAll();
        } else if (userRole === "user") {
            // ✅ Users: Fetch only their own requests (ITS matching)
            console.log(`User: Fetching requests for ITS: '${ITS}'...`);
            users = await OwsReqForm.findAll({
                where: { ITS },
            });
        } else if (userRole === "mini-admin") {
            if (!mohalla) {
                return res.status(400).json({
                    success: false,
                    message: "Mohalla name is required for Mini-Admin",
                });
            }

            if (mohalla === "Unknown") {
                // ✅ Mini-Admin + Mohalla is "Unknown" → Fetch based on organization
                if (!org) {
                    return res.status(400).json({
                        success: false,
                        message: "Organization is required when Mohalla is Unknown",
                    });
                }
                console.log(`Mini-Admin: Fetching requests for organization: '${org}'...`);
                users = await OwsReqForm.findAll({
                    where: { organization: org },
                });
            } else {
                // ✅ Mini-Admin + Mohalla Provided → Fetch based on Mohalla
                console.log(`Mini-Admin: Fetching requests for mohalla: '${mohalla}'...`);
                users = await OwsReqForm.findAll({
                    where: { mohalla },
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Invalid user role",
            });
        }

        // ✅ If no users found, return a 404 response
        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No requests found for the specified criteria",
            });
        }

        console.log(users);

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

// POST /api/aiut-records (Create a new AiutRecord)
app.post("/create-aiut-record", async (req, res) => {
    try {
        const { org, mohalla, its, sf, student, father, school, parents_p, org_p } = req.body;

        // Validate required fields
        if (!org || !student || !father || !school) {
            return res.status(400).json({ error: "Missing required fields (org, student, father, school)" });
        }

        // Create a new record
        const newRecord = await AiutRecord.create({
            org,
            mohalla,
            its,
            sf,
            student,
            father,
            school,
            parents_p: parents_p || 0,
            org_p: org_p || 0
        });

        res.status(201).json({ message: "Record created successfully", record: newRecord });
    } catch (error) {
        console.error("Error creating record:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/fetch-aiut-records", async (req, res) => {
    try {
        const { its } = req.body;

        if (!its) {
            return res.status(400).json({ error: "ITS parameter is required in the request body" });
        }

        const records = await AiutRecord.findAll({ where: { its } });

        if (records.length === 0) {
            return res.status(404).json({ message: "No records found for this ITS" });
        }

        res.status(200).json(records);
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/fetch-records", async (req, res) => {
    try {
        const { its } = req.body;

        if (!its) {
            return res.status(400).json({ error: "ITS parameter is required in the request body" });
        }

        // Fetch records from both AiutRecord & AmbtRecord tables
        const aiutRecords = await AiutRecord.findAll({ where: { its } });
        const ambtRecords = await AmbtRecord.findAll({ where: { its } });
        const stsmfRecords = await StsmfRecord.findAll({ where: { its } });


        // Convert database objects to plain JSON
        const aiutData = aiutRecords.map(record => ({
            id: record.id || "",
            org: record.org || "",
            mohalla: record.mohalla || "",
            its: record.its || "",
            sf: record.sf || "",
            student: record.student || "",
            father: record.father || "",
            school: record.school || "",
            parents_p: record.parents_p || "",
            date: "",
            org_p: record.org_p || "",
            amount: "",  // Amount field will be empty for Aiut records
            created_at: record.created_at || "",
            updated_at: record.updated_at || ""
        }));

        const ambtData = ambtRecords.map(record => ({
            id: record.id || "",
            org: record.org || "",
            mohalla: record.mohalla || "",
            its: record.its || "",
            sf: record.sf || "",
            student: record.student || "",
            father: "",  // AmbtRecord doesn't have 'father', so keep empty
            school: record.school || "",
            date: record.date || "",
            parents_p: "", // No parents_p in AmbtRecord
            org_p: "", // No org_p in AmbtRecord
            amount: record.amount || "", // Amount field present in AmbtRecord
            created_at: record.created_at || "",
            updated_at: record.updated_at || ""
        }));

        const stsmfData = stsmfRecords.map(record => ({
            id: record.id || "",
            org: record.org || "",
            mohalla: record.mohalla || "",
            its: record.its || "",
            sf: record.sf || "",
            student: "",
            father: "",
            school: "",
            parents_p: "",
            date: "",
            org_p: "",
            amount: record.amount || "", // Amount field present in AmbtRecord
            created_at: record.created_at || "",
            updated_at: record.updated_at || ""
        }));

        // Merge both datasets into one array
        const combinedData = [...aiutData, ...ambtData, ...stsmfData];

        console.log(combinedData);

        if (combinedData.length === 0) {
            return res.status(404).json({ message: "No records found for this ITS" });
        }

        res.status(200).json(combinedData);
    } catch (error) {
        console.error("Error fetching records:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/api-version", (req, res) => {
    res.status(200).json({ version: API_VERSION });
});

app.get("/fetch-goods", (req, res) => {
    console.log("FETCHING");
    const sql = "SELECT * FROM goods";
    db2.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});

//////////////////////////
// Storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const studentId = req.body.studentId;
      const docType = file.fieldname; // Document type is dynamically determined by the field name
      
      if (!docType) {
        return cb(new Error('Document type is undefined'));
      }
  
      // Define the folder path dynamically based on studentId and document type
      const folderPath = `./uploads/${studentId}/${docType}`;
      console.log(`Uploading to folder: ${folderPath}`);
  
      // Create the folder structure if it doesn't exist
      fs.mkdirSync(folderPath, { recursive: true });
  
      cb(null, folderPath);  // The folder path where the file will be stored
    },
    filename: (req, file, cb) => {
      const studentId = req.body.studentId;
      const docType = file.fieldname;  // Document type
      const reqId = req.body.reqId || Date.now();  // Include reqId or use timestamp if not provided
      
      if (!docType) {
        return cb(new Error('Document type is undefined'));
      }
  
      // Determine the file extension based on mimetype
      let extname = '';
      if (file.mimetype === 'application/pdf') {
        extname = '.pdf';
      } else if (file.mimetype === 'image/jpeg') {
        extname = '.jpg';
      } else if (file.mimetype === 'image/png') {
        extname = '.png';
      } else if (file.mimetype === 'application/msword') {
        extname = '.doc';
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extname = '.docx';
      }
  
      // Generate the dynamic filename
      const fileName = `${studentId}_${docType}_${reqId}`;
      cb(null, fileName + extname);  // Return the final filename
    }
  });
  
  // Initialize multer with the storage configuration
  const upload = multer({ storage: storage });

// Endpoint to upload a single document of any type
app.post('/upload', upload.any(), (req, res) => {

    // Check if files are uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No file uploaded.');
    }
  
    // Since upload.any() can upload files with different field names,
    // check the files in req.files and handle dynamically.
    const uploadedFile = req.files[0];  // We expect only one file in this case.

    console.log(uploadedFile.path);
  
    // Return a success message with the file path
    res.status(200).send({
      message: 'File uploaded successfully',
      file: {
        docType: uploadedFile.fieldname,  // Field name indicates the document type
        filePath: uploadedFile.path,      // Path to the uploaded file
      }
    });
  });

/// DELETE endpoint for removing a document
// DELETE endpoint for removing a document
app.delete('/delete', (req, res) => {
    const { studentId, docType, filePath } = req.query;  // Get filePath, studentId, and docType from the query
    
    console.log('Received request to delete:', { studentId, docType, filePath });
    
    // Validate that all required parameters are provided
    if (!studentId || !docType || !filePath) {
      return res.status(400).send({ message: 'Missing required parameters.' });
    }
  
    // Resolve the full file path from the `filePath` query and ensure no additional prefixes are included
    const resolvedFilePath = path.join(__dirname,filePath);
  
    console.log(`Attempting to delete: ${resolvedFilePath}`);
    
    // Delete the file from the file system
    fs.unlink(resolvedFilePath, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send({ message: 'Error deleting file.' });
      }
      // Successfully deleted the file
      res.status(200).send({ message: 'File deleted successfully.' });
    });
  });

  const upload_paktalim = multer();

  app.post("/update-paktalim-profile", upload_paktalim.none(), async (req, res) => {
    try {
        const {
            m_id,
            p_id,
            j_id,
            its_id,
            c_id,
            city_id,
            imani,
            i_id,
            scholarship_taken,
            qardan,
            scholar,
            class_id,
            s_id,
            year_count_dir,
            edate,
            duration,
            sdate
        } = req.body;

        // Construct FormData (multipart)
        const formData = new URLSearchParams();
        formData.append("m_id", m_id);
        if (p_id) formData.append("p_id", p_id);
        formData.append("j_id", j_id);
        formData.append("its_id", its_id);
        formData.append("c_id", c_id);
        formData.append("city_id", city_id);
        formData.append("imani", imani);
        formData.append("i_id", i_id);
        formData.append("scholarship_taken", scholarship_taken);
        formData.append("qardan", qardan);
        formData.append("scholar", scholar);
        formData.append("class_id", class_id);
        formData.append("s_id", s_id);
        if (year_count_dir) formData.append("year_count_dir", year_count_dir);
        formData.append("edate", edate);
        formData.append("duration", duration);
        formData.append("sdate", sdate);

        // Construct API URL
        const apiUrl = `https://paktalim.com/admin/ws_app/UpdateProfile?access_key=bbb1d493d3c4969f55045326d6e2f4a662b85374&username=40459629`;

        // Send the form-data request using Axios
        const response = await axios.post(apiUrl, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // Send the API response back to the client
        res.json(response.data);
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Internal Server Error" });
    }
});