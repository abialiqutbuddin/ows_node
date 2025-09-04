const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const https = require("https");
const db = require("./config/db");
const FormData = require("form-data"); // Import FormData for multipart requests
const db2 = require("./config/mysql");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const authMiddleware = require("./middleware/authMiddleWare");
const sendMail = require("./config/mail");
require("dotenv").config();
const OwsCodeFile = require('./models/owsCodeFile.model');
const OwsReqForm = require("./models/owsReqForm.model");
const OwsReqMas = require("./models/owsReqMas.model");
const AiutRecord = require("./models/aiut_record.model");
const AmbtRecord = require("./models/ambt_record.model");
const StsmfRecord = require("./models/stsmf_record.model");
const Guardian = require("./models/guardian.model");
const OwsReqFormAssignmentHistory = require('./models/assignedHistory.model.js');
const User = require("./models/user.model");
const StudentApplicationDraft = require('./models/student_application_draft.model');
const transferDraftToApplication = require("./controllers/transferDraftToApplication");
const multer = require('multer');
const path = require('path');
const app = express();
const { body, validationResult } = require("express-validator");
const sequelize = require("./config/db");
app.use(cors());
const xml2js = require('xml2js');
app.use(bodyParser.json());
const mysql = require('mysql2/promise');
const nodemailer = require("nodemailer");
const {
  sequelize: aiut_sequelize,
  FinancialSurvey,
  FinancialSurveyFee,
  FinancialSurveyGoods,
  FinancialYear,
  InstituteCategory,
  Mohallah,
  StudentInstitute,
  StudentFee,
  FeeType,
  Class,
  School,
  Section,
  Goods,
} = require('./models/aiut_insertion.model.js');

aiut_sequelize
  .authenticate()
  .then(() => console.log('✔️  Database connection established to AIUT SEQ'))
  .catch(err => console.error('❌  Unable to connect to DB:', err));

const { v4: uuidv4 } = require('uuid');
const API_VERSION = "2.2.0";

const PORT = 3001;

app.use(
  '/pdfs',
  express.static(path.join(__dirname, 'uploads', 'application_pdf'))
);

//Load SSL Certificates
// const options = {
//     key: fs.readFileSync("/etc/letsencrypt/live/dev.imadiinnovations.com/privkey.pem"),
//     cert: fs.readFileSync("/etc/letsencrypt/live/dev.imadiinnovations.com/fullchain.pem"),
// };
// // Start HTTPS Server
// https.createServer(options, app).listen(PORT, () => {
//     console.log(`HTTPS Server running on https://dev.imadiinnovations.com:${PORT}`);
// });
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
const uploadRoutes = require("./utils/upload");
//app.use("/upload", uploadRoutes);

// Authentication Routes
app.use("/auth", authRoutes);
app.use("/", moduleRoutes, permissionRoutes, userRoutes);

app.get("/get-last-req", async (req, res) => {
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

// Allow only specific hosts to avoid SSRF
const ALLOWED_HOSTS = new Set(['followup.qardanhasana.in']);

// TEMP: hosts where we bypass TLS verification (remove once fixed)
const INSECURE_HOSTS = new Set(['followup.qardanhasana.in']);

function httpsAgentFor(u) {
  const { host } = new URL(u);
  if (INSECURE_HOSTS.has(host)) {
    return new https.Agent({ rejectUnauthorized: false }); // TEMP ONLY
  }
  return new https.Agent({ rejectUnauthorized: true });
}

app.post('/fetch-image', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'Image URL is required' });
    const target = new URL(url);
    if (!/^https?:$/.test(target.protocol)) return res.status(400).json({ error: 'Only http/https URLs are allowed' });
    if (!ALLOWED_HOSTS.has(target.host)) return res.status(403).json({ error: 'Host not allowed' });

    const upstream = await axios.get(target.toString(), {
      responseType: 'stream',
      httpsAgent: httpsAgentFor(url),
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': target.origin
      },
      timeout: 15000,
      validateStatus: () => true
    });

    if (upstream.status < 200 || upstream.status >= 300) {
      return res.status(upstream.status).send(`Upstream error: ${upstream.statusText}`);
    }

    const type = upstream.headers['content-type'] || 'application/octet-stream';
    if (!type.startsWith('image/')) return res.status(400).send('URL did not return an image');

    res.setHeader('Content-Type', type);
    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    upstream.data.on('error', e => (!res.headersSent ? res.status(502).end('Upstream stream error') : res.destroy(e)));
    upstream.data.pipe(res);
  } catch (e) {
    console.error('Fetcher error:', e.message, e.code || '');
    if (e.response) return res.status(e.response.status).send(e.response.statusText);
    res.status(500).send(`Failed to fetch image: ${e.code || e.message}`);
  }
});
//const axios = require("axios");

app.post("/get-profile", async (req, res) => {
  try {
    const { its_id } = req.body;

    if (!its_id || typeof its_id !== "string" || its_id.trim().length === 0) {
      return res.status(400).json({ error: "'its_id' must be a non-empty string" });
    }

    console.log("Fetching main profile for ITS ID:", its_id);

    // Get main profile
    const profileUrl = `https://paktalim.com/admin/ws_app/GetProfileEducation/${its_id}?access_key=8803c22b50548c9d5b1401e3ab5854812c4dcacb&username=40459629&password=1107865253`;
    const mainProfileRes = await axios.get(profileUrl);
    const profileData = mainProfileRes.data;

    // Fetch Deeni Education separately
    console.log("Fetching deeni education...");
    const deeniUrl = `https://paktalim.com/admin/ws_app/GetProfileDeeniEducation/${its_id}`;
    const deeniParams = {
      access_key: '0e8012b7e5ae222b77834b509aa8f13f1ee8cc43',
      username: '40459629'
    };

    const deeniRes = await axios.get(deeniUrl, {
      params: deeniParams,
      headers: {
        Authorization: 'Basic cGFrdGFsaW06RzcjdkQhOXBaJng='
      }
    });

    const deeniEducation = Array.isArray(deeniRes.data?.deeni_education)
      ? deeniRes.data.deeni_education
      : [];

    profileData.deeni_education = deeniEducation;

    return res.status(200).json(profileData);

  } catch (error) {
    console.error("Error fetching profile data:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: "Failed to fetch profile data",
        details: error.response.data
      });
    }

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

//GET PAKTALIM DEENI EDUCATION
app.post('/get-profile-deeni', async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required in the request body.' });
  }

  const url = `https://paktalim.com/admin/ws_app/GetProfileDeeniEducation/${studentId}`;
  const params = {
    access_key: '0e8012b7e5ae222b77834b509aa8f13f1ee8cc43',
    username: '40459629'
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: 'Basic cGFrdGFsaW06RzcjdkQhOXBaJng='
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch Deeni education profile.' });
  }
});

//GET REQUEST FOR PROFILE DEENI

app.get('/getDeeniEducation/:studentId', async (req, res) => {
  const { studentId } = req.params;

  const url = `https://paktalim.com/admin/ws_app/GetProfileDeeniEducation/${studentId}`;
  const params = {
    access_key: '0e8012b7e5ae222b77834b509aa8f13f1ee8cc43',
    username: '40459629'
  };

  try {
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: 'Basic cGFrdGFsaW06RzcjdkQhOXBaJng='
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ error: 'Failed to fetch Deeni education profile.' });
  }
});


// CRC FAMILY API
app.post("/get-family-profile", async (req, res) => {
  try {
    const { its_id } = req.body;

    if (!its_id || typeof its_id !== "string" || its_id.trim().length === 0) {
      return res.status(400).json({ error: "'its_id' must be a non-empty string" });
    }

    const apiUrl = "http://36.50.12.171:8083/crc_live/Q1JDTXVtaW5NZW1iZXJQcm9maWxl";

    const requestBody = {
      user_name: "umoor_talimiyah",
      password: "UTalim2025",
      token: "1242621ebdaac37b03d88310abc26f9aaee505f7e5654a47421fb39ec6ece94f",
      its_id: its_id
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    return res.status(200).json(response.data);

  } catch (error) {
    console.error("Error fetching family data:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: "Failed to fetch family data",
        details: error.response.data
      });
    }

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// Endpoint to fetch family profile data
app.post("/get-family-profile-old", async (req, res) => {
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

app.post("/fetch-pdf", async (req, res) => {
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
// app.post("/send-email", async (req, res) => {
//   const { to, subject, text, html } = req.body;

//   if (!to || !subject || (!text && !html)) {
//     return res.status(400).json({ success: false, message: "Missing required fields" });
//   }

//   const response = await sendMail(to, subject, text, html);

//   if (response.success) {
//     res.status(200).json(response);
//   } else {
//     res.status(500).json(response);
//   }
// });

//GET FROM URL
app.post("/get-url", async (req, res) => {
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

app.post("/post-url", async (req, res) => {
  try {
    const { url, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Validate URL
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Send POST request with form data
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
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
        ITS, studentFirstName, studentFullName, reqByITS, reqByName, city, institution, class_degree, fieldOfStudy, subject_course,
        yearOfStart, grade, email, contactNo, whatsappNo, purpose, fundAsking, classification, cnic,
        organization, description, currentStatus, created_by, updated_by, mohalla, address, dob, gender, hasGuardian, fatherCnic, motherCnic
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

      // ✅ Check for existing application
      console.log(`🔍 Checking for existing application for ITS: ${ITS}, Organization: ${organization}, Year of Start: ${yearOfStart}...`);
      const existingApplication = await OwsReqForm.findOne({
        where: {
          ITS,
          organization,
          yearOfStart
        },
        transaction
      });

      if (existingApplication) {
        //await transaction.rollback();
        const repeatRequest = await OwsReqForm.create(
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
            currentStatus: "Repeat",
            draft_id: null,
            created_by,
            updated_by,
            mohalla,
            studentName: studentFullName,
            gender,
            hasGuardian,
            fatherCnic,
            motherCnic,
            cnic,
          },
          { transaction }
        );

        await transaction.commit();

        return res.status(202).json({
          success: false,
          message: "An application already exists for this ITS, organization, and year of start.",
          data: { reqId: repeatRequest.reqId, status: "Repeat" }
        });
      }

      //CREATE DRAFT APPLICATION
      console.log("📝 Creating empty student_application_draft record...");
      const draft = await StudentApplicationDraft.create({}, { transaction });
      const draftId = draft.id;
      console.log("✅ Empty draft created with ID:", draftId);

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
          currentStatus: "Partially filled",
          draft_id: draftId,
          created_by,
          updated_by,
          mohalla,
          studentName: studentFullName,
          gender: gender,
          hasGuardian: hasGuardian,
          fatherCnic: fatherCnic,
          motherCnic: motherCnic,
          cnic: cnic,
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Request Form submitted successfully.",
        data: {
          reqId: newRequest.reqId,
          draft_id: draftId
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("🚨 Error submitting request form:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }
);

// POST /create-draft
app.post("/create-draft-application", async (req, res) => {
  try {
    const draft = await StudentApplicationDraft.create({}); // create empty draft
    return res.status(201).json({
      success: true,
      message: "Draft created successfully.",
      draftId: draft.id
    });
  } catch (error) {
    console.error("🚨 Error creating draft:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create draft.",
      error: error.message
    });
  }
});

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
      } else if (mohalla === "ALL") {
        console.log("mohalla: Fetching all requests...");
        users = await OwsReqForm.findAll();
      }
      else {
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
  "PDF Not Generated",
  "Request Submitted",
  "Request Received",
  "Partially filled",
  "Reupload",
  "Resubmitted",
  "Rejected by Evaluator",
  "Sent for Approval",
  "Request Rejected",
  "In-Hold",
  "Approved",
];

app.get('/api/get-all-status', (req, res) => {
  res.json(validStatuses);
});

// ✅ API: Update Request Status (POST)
app.post("/update-request-status", async (req, res) => {
  try {
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

app.post("/all-requests", async (req, res) => {
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

const { Op, fn, col, where } = require('sequelize');

app.post("/all-requests-by-organization", async (req, res) => {
  const { organization, mohalla } = req.body;

  try {
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization is required",
      });
    }

    const orgLower = organization.trim().toLowerCase();
    let requests;

    if (orgLower === "all") {
      // ✅ Return all requests (appId not null)
      requests = await OwsReqForm.findAll({
        where: {
          [Op.or]: [
            { application_id: { [Op.ne]: null } },
            { currentStatus: 'Repeat' }
          ]
        },
        order: [['created_at', 'DESC']],
      });

    } else if (orgLower === "dini") {
      // ✅ Special case: Filter by mohalla
      if (!mohalla) {
        return res.status(400).json({
          success: false,
          message: "Mohalla is required when organization is Dini",
        });
      }

      // requests = await OwsReqForm.findAll({
      //   where: {
      //     [Op.and]: [
      //       { mohalla: mohalla.trim() },
      //       { application_id: { [Op.ne]: null } }
      //     ]
      //   },
      //   order: [['created_at', 'DESC']],
      // });
      requests = await OwsReqForm.findAll({
        where: {
          [Op.and]: [
            { mohalla: mohalla.trim() },
            {
              [Op.or]: [
                { application_id: { [Op.ne]: null } },
                { currentStatus: 'Repeat' }
              ]
            }
          ]
        },
        order: [['created_at', 'DESC']],
      });

    } else {
      // ✅ Default: Filter by organization (case-insensitive)
      requests = await OwsReqForm.findAll({
        where: {
          [Op.and]: [
            where(fn('LOWER', col('organization')), orgLower),
            {
              [Op.or]: [
                { application_id: { [Op.ne]: null } },
                { currentStatus: 'Repeat' }
              ]
            }
          ]
        },
        order: [['created_at', 'DESC']],
      });
    }

    if (!requests.length) {
      return res.status(404).json({
        success: false,
        message: "No requests found for the given organization/mohalla",
      });
    }

    return res.status(200).json({
      success: true,
      data: requests,
    });

  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.post("/all-requests-by-coordinator", async (req, res) => {
  const { organization, coordinator } = req.body;

  try {
    if (!organization) {
      return res.status(400).json({
        success: false,
        message: "Organization is required",
      });
    }

    const orgTrimmed = organization.trim();
    const coordTrimmed = coordinator?.trim(); // Optional

    let whereClause = {
      [Op.or]: [
        { application_id: { [Op.ne]: null } },   // normal condition
        { currentStatus: "Repeat" }              // allow repeat even if null
      ]
    };

    if (orgTrimmed.toLowerCase() !== "all") {
      whereClause.organization = orgTrimmed;
    }

    if (coordTrimmed) {
      whereClause.assignedTo = coordTrimmed;
    }

    const requests = await OwsReqForm.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    if (!requests.length) {
      return res.status(404).json({
        success: false,
        message: "No requests found for the given filters",
      });
    }

    return res.status(200).json({
      success: true,
      data: requests,
    });

  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.get("/api/completed-requests", async (req, res) => {
  try {
    console.log("Fetching requests where application_id is NOT NULL");

    const requests = await OwsReqForm.findAll({
      where: {
        application_id: {
          [Op.ne]: null
        }
      }
    });

    console.log(`Found ${requests.length} requests`);

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
    console.error("Error fetching completed requests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

app.post("/requests-by-organization", async (req, res) => {
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

app.post("/run-query", async (req, res) => {
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
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

//////////////////////////
// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const studentId = req.body.studentId;
    const reqId = req.body.reqId;
    const folderPath = `./uploads/${studentId}_${reqId}`;

    if (!studentId || !reqId) {
      return cb(new Error('Missing studentId or reqId'));
    }

    console.log(`Uploading to folder: ${folderPath}`);

    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },

  filename: (req, file, cb) => {
    const docType = file.fieldname;

    if (!docType) {
      return cb(new Error('Document type is undefined'));
    }

    // Get extension from mimetype
    let extname = '';
    switch (file.mimetype) {
      case 'application/pdf':
        extname = '.pdf';
        break;
      case 'image/jpeg':
        extname = '.jpg';
        break;
      case 'image/png':
        extname = '.png';
        break;
      case 'application/msword':
        extname = '.doc';
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        extname = '.docx';
        break;
      default:
        extname = path.extname(file.originalname); // fallback
    }

    const fileName = `${docType}${extname}`; // e.g., cnic_front.pdf
    cb(null, fileName);
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Endpoint to upload a single document of any type
app.post('/upload', upload.any(), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No file uploaded.');
  }

  const uploadedFile = req.files[0];

  res.status(200).send({
    message: 'File uploaded successfully',
    file: {
      docType: uploadedFile.fieldname,
      filePath: uploadedFile.path,
    }
  });
});

// DELETE endpoint for removing a document
app.delete('/delete', (req, res) => {
  const { studentId, docType, filePath } = req.query;  // Get filePath, studentId, and docType from the query

  console.log('Received request to delete:', { studentId, docType, filePath });

  // Validate that all required parameters are provided
  if (!studentId || !docType || !filePath) {
    return res.status(400).send({ message: 'Missing required parameters.' });
  }

  // Resolve the full file path from the `filePath` query and ensure no additional prefixes are included
  const resolvedFilePath = path.join(__dirname, filePath);

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

app.post('/get-student-documents', async (req, res) => {
  const { studentId, reqId } = req.body;

  if (!studentId || !reqId) {
    return res.status(400).json({ message: 'Missing studentId or reqId in request body' });
  }

  const folderName = `${studentId}_${reqId}`;
  const folderPath = path.join(__dirname, 'uploads', folderName);

  try {
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ message: 'No documents found for this student & reqId.' });
    }

    const files = fs.readdirSync(folderPath);
    const documents = files.map(file => {
      const docType = path.parse(file).name; // filename without extension
      return {
        docType,
        fileName: file,
        filePath: path.join('uploads', folderName, file),
      };
    });

    return res.status(200).json({
      studentId,
      reqId,
      documents,
    });
  } catch (err) {
    console.error('❌ Error reading documents:', err);
    return res.status(500).json({ message: 'Server error fetching documents.' });
  }
});

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'abialigadi@gmail.com',
//     pass: 'wxyo ylqm hrok vmxx'  // use App Password if 2FA is enabled
//   }
// });

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

    // Only email if response.data contains "success"
    // if (response.data?.success === true || response.data?.status === "success") {
    //   await transporter.sendMail({
    //     from: '"OWS" <abialigadi@gmail.com>',
    //     to: "alaqmar11@gmail.com",
    //     //to: "abialigadi@gmail.com",
    //     subject: "Profile Update Successful",
    //     text: `Request to check given ITS # ${its_id}, profile update done by himself/family and if its completed then mark Status 'Complete'.`
    //   });
    // }

    // Send the API response back to the client
    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.response ? error.response.data : "Internal Server Error" });
  }
});


app.post("/post-url-v2", upload.none(), async (req, res) => {
  try {
    const { url, data } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Validate URL format
    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Convert `data` JSON object to `FormData`
    const formData = new FormData();
    for (const key in data) {
      if (Array.isArray(data[key])) {
        // Handle arrays (e.g., multiple `sub_id[]` values)
        data[key].forEach(value => formData.append(`${key}[]`, value));
      } else {
        formData.append(key, data[key]);
      }
    }

    // Send POST request with multipart/form-data
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(), // Set correct form-data headers
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});


app.put("/add-guardian", async (req, res) => {
  try {
    const { name, ITS, contact, relation, student_ITS } = req.body;

    // Check if the guardian exists
    const guardian = await Guardian.findOne({ where: { ITS } });

    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    // Validate if the student ITS exists (optional check)
    if (student_ITS) {
      const student = await OwsReqMas.findOne({ where: { ITS: student_ITS } });
      if (!student) {
        return res.status(400).json({ message: "Student ITS not found" });
      }
    }

    // Update guardian details
    await guardian.update({ name, ITS, contact, relation });

    // If student_ITS is provided, update the student's guardian
    if (student_ITS) {
      await OwsReqMas.update({ guardian_ITS: ITS }, { where: { ITS: student_ITS } });
    }

    res.status(200).json({ message: "Guardian updated successfully", guardian });
  } catch (error) {
    console.error("Error updating guardian:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


const { DECIMAL } = require('sequelize');


app.post('/save-draft', async (req, res) => {
  const { application_id, draft_data } = req.body;

  console.log("📥 Received draft data for application_id:", application_id);
  console.log("📝 Draft data content:", draft_data);

  if (!application_id || !draft_data) {
    console.error("❌ Missing application_id or draft_data");
    return res.status(400).json({ error: 'Missing application_id or draft_data' });
  }

  try {
    const existing = await StudentApplicationDraft.findByPk(application_id);

    // 1) Grab the model's attributes map
    const attributes = StudentApplicationDraft.getAttributes();

    // 2) Build a set of all DECIMAL columns by checking .type.key === 'DECIMAL'
    const decimalFields = Object.entries(attributes)
      .filter(([name, def]) => def.type && def.type.key === 'DECIMAL')
      .map(([name]) => name);

    // 3) Normalize only those fields:
    //    if key is a decimal column AND val is '', convert to null
    const normalizedData = Object.entries(draft_data).reduce((acc, [key, val]) => {
      if (decimalFields.includes(key) && val === '') {
        acc[key] = null;
      } else {
        acc[key] = val;
      }
      return acc;
    }, {});


    if (existing) {
      console.log("🔁 Existing draft found. Updating...");
      await StudentApplicationDraft.update(draft_data, {
        where: { id: application_id },
      });
      console.log("✅ Draft updated successfully for:", application_id);
    } else {
      console.log("🆕 No existing draft. Creating new entry...");
      await StudentApplicationDraft.create({
        id: application_id,
        ...normalizedData,
      });
      console.log("✅ Draft created successfully for:", application_id);
    }

    res.status(200).json({ message: '✅ Draft saved successfully' });
  } catch (error) {
    console.error('❌ Error saving draft:', error.message);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/load-draft/:application_id', async (req, res) => {
  const { application_id } = req.params;

  try {
    const draft = await StudentApplicationDraft.findByPk(application_id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.status(200).json(draft);
  } catch (error) {
    console.error('❌ Error loading draft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/submit-draft/:id", async (req, res) => {
  const draftId = req.params.id;

  try {
    const result = await transferDraftToApplication(draftId);
    res.status(200).json({
      message: "Draft submitted successfully.",
      applicationId: result.applicationId
    });
  } catch (err) {
    console.error("Submission error:", err);
    res.status(500).json({
      message: "Failed to submit application.",
      error: err.message
    });
  }
});

app.post('/code-by-group', async (req, res) => {
  try {
    const { codGroup } = req.body;

    if (!codGroup) {
      return res.status(400).json({ error: "codGroup is required" });
    }

    const codes = await OwsCodeFile.findAll({
      where: { codGroup }
    });

    res.status(200).json(codes);
  } catch (error) {
    console.error("Error fetching code group:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// const SOAP_URL = 'https://qardanhasana.pk/BQHT_App_WS/BQHTAPP.asmx';
// const NAMESPACE = 'http://test.qardanhasana.pk/BQHT_App_WS';


// async function callSoap(action, bodyXml) {
//   // 1) Build the full SOAP envelope
//   const envelope = `<?xml version="1.0" encoding="utf-8"?>
//   <soap:Envelope 
//       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
//       xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
//       xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
//     <soap:Body>
//       ${bodyXml}
//     </soap:Body>
//   </soap:Envelope>`;

//   // 2) Send it
//   const response = await axios.post(SOAP_URL, envelope, {
//     headers: {
//       'Content-Type': 'text/xml; charset=utf-8',
//       'SOAPAction': `"${NAMESPACE}/${action}"`
//     },
//     timeout: 10000, // 10s timeout for debugging
//   });

//   // 3) Parse XML → JS object
//   let parsed;
//   try {
//     parsed = await xml2js.parseStringPromise(response.data, {
//       explicitArray: false,
//       ignoreAttrs: true
//     });
//   } catch (xmlErr) {
//     throw xmlErr;
//   }

//   return parsed;
// }

// ─────────────────────────────────────────────────────────────────────────────
// Route: POST /occupationDetails
//  - Reads ITS credentials from JSON body
//  - Calls AuthenticateFundReport → gets token
//  - Calls Get_WorkProfile_BasicDetail → gets JSON blob
//  - Logs DataTable to console & returns it
// ─────────────────────────────────────────────────────────────────────────────
const { Parser } = require('xml2js');

const SOAP_URL = 'https://qhlive.qardanhasana.pk/BQHT_App_WS/BQHTAPP.asmx';
const NAMESPACE = 'http://test.qardanhasana.pk/BQHT_App_WS';

// 1) Lenient XML parser
const soapParser = new Parser({
  strict: false,
  explicitArray: false,
  tagNameProcessors: [name => name.replace(/^.+:/, '')],
});

// 2) SOAP helper
async function callSoap(action, bodyXml) {
  const envelope = `
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:xsd="http://www.w3.org/2001/XMLSchema"
      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        ${bodyXml}
      </soap:Body>
    </soap:Envelope>`;

  const { data: rawXml } = await axios.post(SOAP_URL, envelope, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"${NAMESPACE}/${action}"`,
    },
  });

  const parsed = await soapParser.parseStringPromise(rawXml);
  const body = parsed.Envelope.Body;
  const respTag = `${action}Response`;
  const resultTag = `${action}Result`;

  if (!body?.[respTag]?.[resultTag]) {
    throw new Error(`Missing <${resultTag}> in ${action} response`);
  }
  return body[respTag][resultTag];
}

// 3) occupationDetails route
app.post('/occupationDetails', async (req, res) => {
  const {
    ITSID,                        // client’s target ITSID
    CountryID = '1',
    DeviceDetail = '0',
    IPAddress = '44.220.174.79',
  } = req.body;

  if (!ITSID) {
    return res
      .status(400)
      .json({ error: 'ITSID is required.' });
  }

  // hard-coded service creds
  const SERVICE_ITSID = '33693369';
  const SERVICE_PASSWORD = 'Beyond@2468';

  try {
    // a) Authenticate
    const authXml = `
      <AuthenticateFundReport xmlns="${NAMESPACE}">
        <ITSID>${SERVICE_ITSID}</ITSID>
        <Password>${SERVICE_PASSWORD}</Password>
        <CountryID>${CountryID}</CountryID>
        <DeviceDetail>${DeviceDetail}</DeviceDetail>
        <IPAddress>${IPAddress}</IPAddress>
      </AuthenticateFundReport>`.trim();

    const rawAuth = await callSoap('AuthenticateFundReport', authXml);

    let authJson;
    try {
      authJson = JSON.parse(rawAuth);
    } catch {
      console.error('Invalid JSON in authenticate:', rawAuth);
      return res
        .status(500)
        .json({ error: 'Invalid JSON in authenticate response.' });
    }

    if (!Array.isArray(authJson) || !authJson[0]?.Token) {
      return res
        .status(500)
        .json({ error: 'Authentication failed. No token returned.' });
    }
    const token = authJson[0].Token;

    // b) Fetch work profile
    const workXml = `
      <Get_WorkProfile_BasicDetail xmlns="${NAMESPACE}">
        <Token>${token}</Token>
        <ITSID>${ITSID}</ITSID>
      </Get_WorkProfile_BasicDetail>`.trim();

    const rawWork = await callSoap('Get_WorkProfile_BasicDetail', workXml);

    let workJson;
    try {
      workJson = JSON.parse(rawWork);
    } catch {
      console.error('Invalid JSON in workprofile:', rawWork);
      return res
        .status(500)
        .json({ error: 'Invalid JSON in workprofile response.' });
    }

    const resultObj = Array.isArray(workJson) ? workJson[0] : workJson;
    if (resultObj.ExcStatus !== 'Success') {
      return res
        .status(500)
        .json({ error: resultObj.ExcMessage || 'Unknown profile error.' });
    }

    // success → send DataTable
    return res.json(resultObj.DataTable ?? []);
  } catch (err) {
    console.error('Error in /occupationDetails:', err.message);
    return res
      .status(500)
      .json({ error: 'Server error.', detail: err.message });
  }
});

app.post('/occupationDetails-old', async (req, res) => {
  const { ITSID, Password, CountryID = '1', DeviceDetail = '0', IPAddress = '' } = req.body;
  if (!ITSID) {
    return res.status(400).json({ error: 'ITSID and Password are required.' });
  }

  try {
    // 1) AuthenticateFundReport
    const authXml = `
        <AuthenticateFundReport xmlns="${NAMESPACE}">
          <ITSID>33693369</ITSID>
          <Password>Beyond@2468</Password>
          <CountryID>${CountryID}</CountryID>
          <DeviceDetail>${DeviceDetail}</DeviceDetail>
          <IPAddress>72.255.0.187</IPAddress>
        </AuthenticateFundReport>`;
    const authResp = await callSoap('AuthenticateFundReport', authXml);

    // rawAuth is a string containing JSON array:
    const rawAuth = authResp['soap:Envelope']
    ['soap:Body']
    ['AuthenticateFundReportResponse']
    ['AuthenticateFundReportResult'];
    let authJson;
    try {
      authJson = JSON.parse(rawAuth);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON in authenticate response.', detail: rawAuth });
    }
    if (!Array.isArray(authJson) || authJson.length === 0 || !authJson[0].Token) {
      return res.status(500).json({ error: 'No token returned.', detail: authJson });
    }
    const token = authJson[0].Token;

    // 2) Get_WorkProfile_BasicDetail
    const workXml = `
        <Get_WorkProfile_BasicDetail xmlns="${NAMESPACE}">
          <Token>${token}</Token>
          <ITSID>${ITSID}</ITSID>
        </Get_WorkProfile_BasicDetail>`;
    const workResp = await callSoap('Get_WorkProfile_BasicDetail', workXml);

    const rawWork = workResp['soap:Envelope']
    ['soap:Body']
    ['Get_WorkProfile_BasicDetailResponse']
    ['Get_WorkProfile_BasicDetailResult'];
    let workJson;
    try {
      workJson = JSON.parse(rawWork);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON in workprofile response.', detail: rawWork });
    }

    // Normalize to an object with ExcStatus / DataTable
    let resultObj = Array.isArray(workJson) ? workJson[0] : workJson;
    if (resultObj.ExcStatus !== 'Success') {
      return res.status(500).json({ error: resultObj.ExcMessage || 'Unknown error', detail: resultObj });
    }

    // Return DataTable (could be array or single object)
    return res.json(resultObj.DataTable);
  } catch (err) {
    console.error('Error in /occupationDetails:', err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

// Configure MySQL pool
const pool = mysql.createPool({
  host: "ls-71e245ea4a0374b94a685ec89d871c50a32f80c2.cotk02keuuc1.us-east-1.rds.amazonaws.com",
  port: "3306",
  user: "ows_user",
  password: "20250507.Osw*",
  database: "ows_db",
});

const aiutpool = mysql.createPool({
  host: '36.50.12.171',
  user: 'aak',
  password: 'Aak@110*',
  port: 3308,
  database: 'aiut',

  // give up to 60s for a TCP connect
  connectTimeout: 60000,

  // if using mysql2, give up to 60s to acquire a free pooled conn
  acquireTimeout: 60000,

  // optional pool tuning
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Load form config JSON
const formConfig = JSON.parse(fs.readFileSync('./form_config.json', 'utf-8'));

// Helper to fetch main form data
async function getMainFormData(appId) {
  const [rows] = await pool.query('SELECT * FROM student_application WHERE id = ?', [appId]);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to fetch repeatable table values
async function getRepeatableTableValues(appId, tableName) {
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE application_id = ?`, [appId]);
  return rows;
}

// Generate serials and merge answers
async function generateFormWithAnswers(appId) {
  const mainData = await getMainFormData(appId);
  if (!mainData) throw new Error('Application not found');

  const result = [];
  let sectionIndex = 1;

  for (const section of formConfig) {
    const sectionObj = {
      serial: `${sectionIndex}`,
      title: section.title,
      questions: []
    };

    if (section.subSections) {
      let subIndex = 1;
      for (const sub of section.subSections) {
        const subPrefix = `${sectionIndex}.${subIndex}`;

        // Totaling and repeatable sub-sections with key only
        if (sub.type === 'repeatable') {
          const values = await getRepeatableTableValues(appId, sub.key);
          sectionObj.questions.push({ serial: subPrefix, key: sub.key, value: values });
        } else if (sub.type === 'totaling') {
          let fieldIndex = 1;
          for (const field of sub.fields) {
            const serial = `${subPrefix}.${fieldIndex}`;
            sectionObj.questions.push({
              serial,
              key: field.key,
              label: field.label,
              value: mainData[field.key] ?? null
            });
            fieldIndex++;
          }
        } else {
          let fieldIndex = 1;
          for (const field of sub.fields) {
            const serial = `${subPrefix}.${fieldIndex}`;
            const question = {
              serial,
              key: field.key,
              label: field.label,
              value: mainData[field.key] ?? null
            };

            // Conditional field: dropdown or text
            if (field.dropdownKey && mainData[field.dropdownKey] !== undefined) {
              question.conditionalKey = field.dropdownKey;
              question.conditionalValue = mainData[field.dropdownKey];
            }
            if (field.textFieldKey && mainData[field.textFieldKey] !== undefined) {
              question.conditionalKey = field.textFieldKey;
              question.conditionalValue = mainData[field.textFieldKey];
            }
            if (field.MultiSelectKey && mainData[field.MultiSelectKey] !== undefined) {
              question.conditionalKey = field.MultiSelectKey;
              question.conditionalValue = mainData[field.MultiSelectKey]?.split(',') || [];
            }
            if (field.hasUnitDropdown && mainData[field.unitKey]) {
              question.unit = mainData[field.unitKey];
            }

            sectionObj.questions.push(question);
            fieldIndex++;
          }
        }
        subIndex++;
      }
    }
    result.push(sectionObj);
    sectionIndex++;
  }

  return { app_id: appId, sections: result };
}

// API endpoint
app.get('/api/application/:id', async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    const formWithAnswers = await generateFormWithAnswers(appId);
    res.json(formWithAnswers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/submit-application', async (req, res) => {
  const { application, repeatables, reqId, aiut_student, aiut_survey } = req.body;
  const conn = await pool.getConnection();

  try {

    let student_id = null;

    await conn.beginTransaction();

    // Insert into main application table
    const [result] = await conn.query(
      `INSERT INTO application_main SET ?`,
      application
    );


    const appId = result.insertId;
    let id = { student_id: null, finSurveyId: null };
    console.log(`New application created with ID: ${appId}`);

    // Insert repeatable entries into corresponding tables
    for (const [tableKey, entries] of Object.entries(repeatables)) {
      for (const entry of entries) {
        entry.application_id = appId;
        await conn.query(`INSERT INTO ${tableKey} SET ?`, entry);
      }
    }

    await conn.commit();

    if (aiut_survey) {
      console.log('Inserting into Aiut Survey table');
      id = await insertAiutSurvey(appId, aiut_survey);
    }

    // Link to request if reqId provided
    if (reqId) {
      await conn.query(
        `UPDATE owsReqForm
     SET application_id = ?,
         currentStatus  = ?,
         aiut_student_id = ?,
        aiut_financial_id = ?

     WHERE reqId = ?`,
        [appId, 'Request Generated', id.student_id, id.finSurveyId, reqId]
      );
    }

    res.json({ success: true, id: appId });

  } catch (err) {
    console.error('Error submitting application:', err);
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to submit application' });
  } finally {
    conn.release(); // 🔁 Use release() not end() for pooled connection
  }
});

function toMySQLDatetime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

app.get('/api/aiut_surveys', async (req, res) => {
  const conn = await aiutpool.getConnection(); // use correct pool

  try {
    const [rows] = await conn.query(`SELECT * FROM survey ORDER BY created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch survey records' });
  } finally {
    await conn.release();
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/form-config', async (req, res) => {
  try {
    const conn = await pool.getConnection();

    // Fetch all sections
    const [sections] = await conn.execute(`SELECT * FROM form_sections ORDER BY sort_order, id`);

    const formConfig = [];

    for (const section of sections) {
      const sectionData = {
        title: section.title,
        key: section.key,
      };

      // Fetch subsections
      const [subsections] = await conn.execute(
        `SELECT * FROM form_subsections WHERE section_id = ? ORDER BY sort_order, id`,
        [section.id]
      );

      if (subsections.length > 0) {
        sectionData.subSections = [];

        for (const sub of subsections) {
          const subSection = {
            title: sub.title,
            key: sub.key,
            fields: [],
          };

          // Fetch fields
          const [fields] = await conn.execute(
            `SELECT * FROM form_fields WHERE subsection_id = ? ORDER BY sort_order, id`,
            [sub.id]
          );

          for (const field of fields) {
            const fieldData = {
              type: field.type,
              label: field.label,
              key: field.field_key,
            };

            if (field.validator) fieldData.validator = field.validator;
            if (field.hint) fieldData.hint = field.hint;
            if (field.parent_key) fieldData.parent_key = field.parent_key;
            if (field.enable_child_on) fieldData.enable_child_on = field.enable_child_on;
            if (!field.enable) fieldData.enable = false;
            if (field.has_unit_dropdown) fieldData.hasUnitDropdown = true;
            if (field.unit_key) fieldData.unitKey = field.unit_key;

            // If it's a repeatable field, load children from form_repeatable_fields
            if (field.type === 'repeatable') {
              const [repeatables] = await conn.execute(
                `SELECT * FROM form_repeatable_fields WHERE parent_field_id = ? ORDER BY sort_order, id`,
                [field.id]
              );

              fieldData.fields = repeatables.map((rf) => {
                const rfData = {
                  type: rf.type,
                  label: rf.label,
                  key: rf.repeatable_field_key,
                };
                if (rf.validator) rfData.validator = rf.validator;
                if (rf.hint) rfData.hint = rf.hint;
                if (!rf.enable) rfData.enable = false;
                return rfData;
              });
            }

            // If it has options (dropdown, multiselect, radio), load from form_field_options
            if (['dropdown', 'multiselect', 'radio'].includes(field.type)) {
              const [options] = await conn.execute(
                `SELECT label, value FROM form_field_options WHERE field_id = ? ORDER BY sort_order, id`,
                [field.id]
              );

              if (options.length > 0) {
                fieldData.options = options.map((opt) => opt.label); // optional: use `.value`
              }
            }

            subSection.fields.push(fieldData);
          }

          sectionData.subSections.push(subSection);
        }
      }

      formConfig.push(sectionData);
    }

    res.json(formConfig);
    conn.release();
  } catch (error) {
    console.error('Error fetching form config:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


const repeatableTables = [
  'income_types',
  'dependents',
  'travelling_expense',
  'education_expenses',
  'business_assets',
  'qh_liability',
  'enayat_liability',
];

// Fetch records from repeatable table
async function fetchRepeatable(conn, tableName, applicationId) {
  try {
    const [rows] = await conn.execute(
      `SELECT * FROM ${tableName} WHERE application_id = ?`,
      [applicationId]
    );
    return rows;
  } catch (err) {
    console.error(`Error fetching from ${tableName}:`, err);
    return [];
  }
}

// GET /api/application/:id
app.get('/api/get-application/:id', async (req, res) => {
  const appId = req.params.id;

  const conn = await pool.getConnection();
  try {
    // Fetch main record
    const [mainRows] = await conn.execute(
      `SELECT * FROM application_main WHERE id = ?`,
      [appId]
    );

    if (mainRows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = mainRows[0];

    // Append repeatable sections
    for (const table of repeatableTables) {
      application[table] = await fetchRepeatable(conn, table, appId);
    }

    res.json(application);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// Assuming Express.js and MySQL2 setup

app.get('/api/keys-applications/:id', async (req, res) => {
  const applicationId = req.params.id;

  // Fetch main application record
  let application;
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM `application_main` WHERE `id` = ?',
      [applicationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    application = rows[0];
  } catch (err) {
    console.error('DB error fetching application:', err);
    return res.status(500).json({ error: 'Database error' });
  }

  // Build response
  const response = { sections: [] };

  for (const sectionConfig of formConfig) {
    const section = { section: sectionConfig.title, subsections: [] };

    if (Array.isArray(sectionConfig.subSections)) {
      for (const subConfig of sectionConfig.subSections) {
        const subsection = { subsection: subConfig.title };

        if (subConfig.type === 'repeatable') {
          let rows = [];
          try {
            [rows] = await pool.execute(
              `SELECT * FROM \`${subConfig.key}\` WHERE \`application_id\` = ?`,
              [applicationId]
            );
          } catch (_) {
            rows = [];
          }

          if (rows.length === 0) rows = [application];

          subsection.entries = rows.map(row => {
            const fields = [];
            for (const fieldConfig of subConfig.fields) {
              fields.push({
                question: fieldConfig.label,
                answer: row[fieldConfig.key] != null ? row[fieldConfig.key] : ''
              });

              if (fieldConfig.itsFieldKey) {
                const itsValue = row[fieldConfig.itsFieldKey] || row.member_its || '';
                fields.push({
                  question: 'Member ITS',
                  answer: itsValue
                });
              }
            }
            return { fields };
          });

        } else {
          subsection.fields = [];

          for (const fieldConfig of (subConfig.fields || [])) {
            if (fieldConfig.type === 'repeatable') {
              let rows = [];
              try {
                [rows] = await pool.execute(
                  `SELECT * FROM \`${fieldConfig.key}\` WHERE \`application_id\` = ?`,
                  [applicationId]
                );
              } catch (_) {
                rows = [];
              }

              subsection.entries = rows.map(row => {
                const fields = [];
                for (const nested of (fieldConfig.fields || [])) {
                  fields.push({
                    question: nested.label,
                    answer: row[nested.key] != null ? row[nested.key] : ''
                  });

                  if (nested.itsFieldKey) {
                    fields.push({
                      question: 'ITS',
                      answer: row[nested.itsFieldKey] != null ? row[nested.itsFieldKey] : ''
                    });
                  }
                }
                return { fields };
              });

            } else {
              subsection.fields.push({
                question: fieldConfig.label,
                answer: application[fieldConfig.key] != null ? application[fieldConfig.key] : ''
              });
            }
          }
        }

        section.subsections.push(subsection);
      }
    }

    response.sections.push(section);
  }

  res.json(response);
});

app.delete('/delete-draft/:id', async (req, res) => {
  const draftId = req.params.id;

  if (!draftId) {
    return res.status(400).json({ success: false, message: 'Draft ID is required' });
  }

  try {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        'DELETE FROM student_application_draft WHERE id = ?',
        [draftId]
      );
      conn.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Draft not found' });
      }

      return res.status(200).json({ success: true, message: 'Draft deleted successfully' });
    } catch (err) {
      conn.release();
      throw err;
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET request form by ITS
app.get("/api/request-form/:its", async (req, res) => {
  try {
    const its = req.params.its;

    const records = await OwsReqForm.findAll({
      where: { ITS: its },
      order: [['created_at', 'DESC']]
    });

    // Map over each record to fetch latest remarks and documents
    const enrichedData = await Promise.all(
      records.map(async (record) => {
        const statusHistory = await OwsReqFormStatusHistory.findOne({
          where: { reqId: record.reqId },

          order: [['changedAt', 'DESC']],
          include: [
            {
              model: OwsStatusRequiredDocs,
              as: 'requiredDocuments',
              attributes: ['documentName']
            }
          ]
        });

        return {
          ...record.toJSON(),
          latestRemarks: statusHistory?.remarks ?? null,
          requiredDocuments: statusHistory?.requiredDocuments?.map(doc => doc.documentName) ?? []
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedData,
    });
  } catch (err) {
    console.error("🚨 Error fetching request form:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get("/api/request-form-all/", async (req, res) => {
  try {
    const records = await OwsReqForm.findAll();

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (err) {
    console.error("🚨 Error fetching request form:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get("/api/create-draft/:reqId", async (req, res) => {
  const { reqId } = req.params;

  const transaction = await sequelize.transaction(); // ensure atomicity

  try {
    // Step 1: Create empty draft
    const draft = await StudentApplicationDraft.create({}, { transaction });
    const draftId = draft.id;
    console.log("✅ Empty draft created with ID:", draftId);

    // Step 2: Find corresponding request form
    const requestForm = await OwsReqForm.findOne({ where: { reqId }, transaction });

    if (!requestForm) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Request form not found for the given reqId" });
    }

    // Step 3: Update request form with draft ID
    await requestForm.update({ draft_id: draftId }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Draft created and linked to request successfully.",
      draftId,
      reqId: requestForm.reqId
    });

  } catch (err) {
    await transaction.rollback();
    console.error("🚨 Error in create-draft:", err);
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
});

app.post('/api/getByReqId', async (req, res) => {
  try {
    const { reqId } = req.body;

    if (!reqId) {
      return res.status(400).json({ error: 'reqId is required' });
    }

    const record = await OwsReqForm.findOne({
      where: { reqId: reqId }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/user-permissions/:its', async (req, res) => {
  const its = req.params.its;

  try {
    const conn = await pool.getConnection();

    // Fetch user details
    const [users] = await conn.execute(
      'SELECT id, Name, email_address, role FROM users_new WHERE ITS = ?',
      [its]
    );

    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    let data = {
      id: user.id,
      name: user.Name,
      email: user.email_address,
      role: user.role,
    };

    if (user.role === 'trust_admin') {
      // Return trusts where user is trust person (trust_person = ITS)
      const [trusts] = await conn.execute(
        'SELECT id, trustid, trustname FROM trust WHERE trust_person = ?',
        [its]
      );
      data.trusts = trusts; // trusts managed by trust admin
    } else if (user.role === 'coordinator') {
      // Return trusts assigned with permissions from user_trust
      const [trusts] = await conn.execute(
        `SELECT t.id, t.trustid, t.trustname, ut.can_view, ut.can_update
         FROM trust t
         JOIN user_trust ut ON t.id = ut.trust_id
         WHERE ut.user_id = ?`,
        [user.id]
      );
      data.assigned_trusts = trusts.map(trust => ({
        id: trust.id,
        trustid: trust.trustid,
        trustname: trust.trustname,
        permissions: {
          can_view: !!trust.can_view,
          can_update: !!trust.can_update
        }
      }));
    }

    conn.release();
    res.json({ success: true, data });

  } catch (err) {
    console.error('Error fetching user permissions:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Serve Flutter web build static files at /ows/testing
app.use('/testing', express.static(path.join(__dirname, 'testing')));

// SPA fallback to index.html for client-side routing
app.get('/testing/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'testing', 'index.html'));
});

app.use(express.urlencoded({ extended: true }));

function flattenFormData(formData) {
  const flatData = { ...formData };

  if (Array.isArray(formData.details)) {
    formData.details.forEach((item, index) => {
      for (const key in item) {
        flatData[`details[${index}][${key}]`] = item[key];
      }
    });
    delete flatData.details;
  }

  return flatData;
}

function flattenFormData(data, parentKey = '') {
  const items = {};
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    const newKey = parentKey ? `${parentKey}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        Object.assign(items, flattenFormData(v, `${newKey}[${i}]`));
      });
    } else if (value !== null && typeof value === 'object') {
      Object.assign(items, flattenFormData(value, newKey));
    } else {
      items[newKey] = value;
    }
  }
  return items;
}

app.post(
  '/api/submit-future-form',
  upload.none(),
  async (req, res) => {
    // ✅ Parse 'details' if it's a stringified JSON
    if (typeof req.body.details === 'string') {
      try {
        req.body.details = JSON.parse(req.body.details);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON in details' });
      }
    }

    // ✅ Conditionally copy fields into details[0] only if details exists
    if (Array.isArray(req.body.details)) {
      const details = req.body.details;

      // Create details[0] if missing
      if (!details[0]) details[0] = {};

      [
        'current_hifz_enrolled',
        'niyat_hifz_enrolled',
        'next_sanad',
        'is_quran_tilawat',
        'sehat_eraab',
        'sehat_huroof',
        'is_tilawat_niyat',
        'tilawat_preferred_days',
        'tilawat_preferred_timings',
        'attended_counselling',
        'comments',
        'will_asbaaq',
        'will_khidmat',
        'khidmat',
      ].forEach((field) => {
        if (req.body[field] !== undefined) {
          details[0][field] = req.body[field];
        }
      });

      req.body.details = details; // keep it
    } else {
      delete req.body.details; // ❌ remove if null or not a valid array
    }

    // ✅ Flatten form
    const flat = flattenFormData(req.body);

    // ✅ Build form data
    const form = new FormData();
    Object.entries(flat).forEach(([key, val]) => {
      form.append(key, val);
    });

    try {
      const response = await axios.post(
        'https://paktalim.com/admin/ws_app/FutureForm?access_key=9a883f01f08afef40186b935037d67d19232d56c&username=40459629',
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: 'Basic cGFrdGFsaW06RzcjdkQhOXBaJng=',
            Cookie: 'DHEducationAdmin=1909a79c7026eb921ca596305120a309',
          },
        }
      );
      res.json({ message: 'Submitted', data: response.data });
    } catch (err) {
      console.error('Submission error', err.response?.data || err.message);
      res.status(500).json({
        error: err.message,
        details: err.response?.data,
      });
    }
  }
);

const upload2 = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-application-pdf', upload2.single('file'), async (req, res) => {
  try {
    const { its, reqId } = req.body;
    if (!its || !reqId) {
      return res.status(400).json({ error: 'Missing its or reqId' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file upload' });
    }

    // build directory and filename
    const targetDir = path.join(__dirname, 'uploads', 'application_pdf');
    fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${its}_${reqId}.pdf`;
    const fileUrl = `https://one-login.attalimiyah.com.pk/ows/pdfs/${filename}`; // .pdf is already here
    const outPath = path.join(targetDir, filename);

    // write the buffer to disk
    fs.writeFileSync(outPath, req.file.buffer);

    // 🔄 Update pdf_url in owsReqForm
    const updated = await OwsReqForm.update(
      { pdf_url: fileUrl },
      { where: { application_id: reqId } }
    );

    if (updated[0] === 0) {
      return res.status(404).json({ error: 'No matching request found to update PDF URL' });
    }

    res.json({
      message: 'Upload successful',
      path: `uploads/application_pdf/${filename}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// app.use(
//   '/pdfs',
//   express.static(path.resolve(__dirname, './uploads/application_pdf'))
// );

app.post('/api/get-application-pdf', (req, res) => {
  const { its, reqId } = req.body;
  if (!its || !reqId) {
    return res.status(400).json({ error: 'Missing its or reqId in request body' });
  }

  const filename = `${its}_${reqId}.pdf`;
  const fullPath = path.join(__dirname, 'uploads', 'application_pdf', filename);

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({
        error: `PDF not found for ITS=${its}, reqId=${reqId}`
      });
    }

    // this must match your `app.use('/pdfs', ...)` above
    const baseUrl = 'https://one-login.attalimiyah.com.pk/ows';
    const fileUrl = `${baseUrl}/pdfs/${encodeURIComponent(filename)}`;

    res.json({ url: fileUrl });
  });
});

app.get("/api/get-instructions", async (req, res) => {
  try {
    const instructions = await OwsCodeFile.findAll({
      where: { codType: "instructions" },
      order: [["codGroup", "ASC"], ["GrpSer", "ASC"]],
      attributes: ["codId", "shortDesc", "longDesc", "GrpSer"],
    });

    res.json({
      success: true,
      data: instructions,
    });
  } catch (error) {
    console.error("Error fetching instructions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

///---------

app.post('/api/login-v2', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'login & password required' });
  }

  try {
    // 1) Look up user by UsrLogin
    const [userRows] = await pool.query(
      `SELECT Id, UsrID, UsrName, UsrITS, UsrLogin, UsrPwd, UsrMobile, UsrMohalla, UsrDesig
       FROM owsadmUsrProfil
       WHERE UsrLogin = ?
       LIMIT 1`,
      [login]
    );
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRows[0];
    // 2) Compare password (plaintext). In production: bcrypt.compare(...)
    if (user.UsrPwd !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const usrID = user.UsrID;

    // 3) Fetch all roles assigned to this user, join in object + company
    const [permRows] = await pool.query(
      `SELECT
         r.RId                AS roleID,
         r.RTitle             AS roleTitle,
         r.Add, r.Edit, r.Delete, r.View, r.Cancel, r.Close, r.\`Update\`,
         o.ObjID              AS objID,
         o.ObjTitle           AS objTitle,
         c.Comp               AS compID,
         c.CompName           AS compName,
         c.CompAddress        AS compAddress,
         c.ContactPerson      AS contactPerson,
         c.ContactMobile      AS contactMobile,
         c.cEmail             AS cEmail
       FROM owsadmUsrRole ur
       JOIN owsadmRoleMas r    ON ur.RID = r.RId
       JOIN owsadmObjMas o     ON r.ObjID = o.ObjID
       JOIN owsadmComp c       ON ur.CompID = c.Comp
       WHERE ur.UsrID = ?`,
      [usrID]
    );

    // 4) Build response
    const userInfo = {
      UsrID: user.UsrID,
      UsrName: user.UsrName,
      UsrITS: user.UsrITS,
      UsrMobile: user.UsrMobile,
      UsrMohalla: user.UsrMohalla,
      UsrDesig: user.UsrDesig,
    };

    const permissions = permRows.map((row) => ({
      objID: row.objID,
      objTitle: row.objTitle,
      roleID: row.roleID,
      roleTitle: row.roleTitle,
      canAdd: row.Add === 1,
      canEdit: row.Edit === 1,
      canDelete: row.Delete === 1,
      canView: row.View === 1,
      canCancel: row.Cancel === 1,
      canClose: row.Close === 1,
      canUpdate: row.Update === 1,
      company: {
        compID: row.compID,
        compName: row.compName,
        compAddress: row.compAddress,
        contactPerson: row.contactPerson,
        contactMobile: row.contactMobile,
        cEmail: row.cEmail,
      }
    }));

    return res.json({ user: userInfo, permissions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

///-----------------------
// GET /roles
app.get('/api/roles', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT MIN(Id) as Id, RId, RTitle
    FROM owsadmRoleMas
    GROUP BY RId, RTitle
  `);
  res.json(rows);
});

// GET /objects
app.get('/api/objects', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT ObjID AS id, ObjTitle AS title FROM owsadmObjMas
  `);
  res.json(rows);
});

// GET /role-assignments
app.get('/api/role-assignments', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.RId, r.ObjID AS id, o.ObjTitle AS title
      FROM owsadmRoleMas r
      LEFT JOIN owsadmObjMas o ON r.ObjID = o.ObjID
    `);

    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.RId]) grouped[row.RId] = [];
      grouped[row.RId].push({ id: row.id, title: row.title ?? '' });
    }

    res.json(grouped);
  } catch (err) {
    console.error("Failed /api/role-assignments:", err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
});

///POST ASSIGNEMNT
app.post('/api/assign-role', async (req, res) => {
  const { RId, RTitle, assignments } = req.body;

  try {
    // 1. Get current assigned ObjIDs for this RId
    const [existingRows] = await pool.query(
      'SELECT ObjID FROM owsadmRoleMas WHERE RId = ?',
      [RId]
    );
    const existingObjIDs = existingRows.map(row => row.ObjID);

    // 2. Extract ObjIDs from incoming request
    const incomingObjIDs = assignments.map(a => a.ObjID);

    // 3. Determine which ObjIDs to DELETE
    const toDelete = existingObjIDs.filter(id => !incomingObjIDs.includes(id));
    for (const objId of toDelete) {
      await pool.query('DELETE FROM owsadmRoleMas WHERE RId = ? AND ObjID = ?', [RId, objId]);
    }

    // 4. Determine which ObjIDs to INSERT
    const toInsert = assignments.filter(a => !existingObjIDs.includes(a.ObjID));

    for (const obj of toInsert) {
      const {
        ObjID, RSNo = 1, Add = 1, Edit = 1, View = 1,
        Delete = 1, Cancel = 1, Close = 1, Update = 1
      } = obj;

      await pool.query(`
        INSERT INTO owsadmRoleMas 
        (RId, RTitle, RSNo, ObjID, \`Add\`, \`Edit\`, \`View\`, \`Delete\`, \`Cancel\`, \`Close\`, \`Update\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [RId, RTitle, RSNo, ObjID, Add, Edit, View, Delete, Cancel, Close, Update]
      );
    }

    res.json({
      success: true,
      deleted: toDelete.length,
      inserted: toInsert.length
    });
  } catch (err) {
    console.error('Assign role failed:', err);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});


///---- User Profile & Assign Role

//Get User Profile
app.get('/api/get-user-profile', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM owsadmUsrProfil');
    res.json(rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).send({ error: 'Failed to fetch users' });
  }

});

app.get('/api/get-user-list', async (req, res) => {
  try {
    // 1) fetch all users
    const [users] = await pool.query(`
      SELECT
        u.UsrID,
        u.UsrITS,
        u.UsrName             AS name,
        u.UsrLogin            AS login,
        u.UsrMobile           AS mobile,
        u.UsrMohalla          AS mohalla,
        u.UsrDesig            AS designation,
        u.UsrEmail            AS email,
        u.UsrPwd              AS password,
        u.CoordinatorMohalla  AS coordinatorMohalla,
        u.CrOn                AS createdAt,
        u.EditOn              AS updatedAt
      FROM owsadmUsrProfil AS u
      ORDER BY u.UsrName
    `);

    // 2) total count (can also just use users.length)
    const cnt = users.length;

    // 3) fetch *only real* roles + permissions + enriched company
    const [userRoles] = await pool.query(`
      SELECT
        ur.UsrID,
        ur.CompID              AS compId,
        ur.mohallah_name       AS mohallah_name,
        c.CompName             AS compName,
        c.CompAddress          AS address,
        c.ContactPerson        AS contactPerson,
        c.ContactMobile        AS contactMobile,
        rm.RId                 AS roleId,
        rm.RTitle              AS roleTitle,
        rm.\`Add\`     AS canAdd,
        rm.\`Edit\`    AS canEdit,
        rm.\`View\`    AS canView,
        rm.\`Delete\`  AS canDelete
      FROM owsadmUsrRole AS ur
      JOIN owsadmRoleMas  AS rm ON rm.RId = ur.RID
      JOIN owsadmComp     AS c  ON c.Comp   = ur.CompID
      WHERE
        ur.UsrID IN (?)
        AND rm.RId IS NOT NULL
    `, [users.map(u => u.UsrID)]);

    // 4) group roles by user, dedupe
    const rolesByUser = userRoles.reduce((acc, row) => {
      const uid = row.UsrID;
      if (!acc[uid]) acc[uid] = new Map();
      const key = `${row.compId}_${row.roleId}`;
      if (!acc[uid].has(key)) {
        acc[uid].set(key, {
          company: {
            id: row.compId,
            name: row.compName,
            address: row.address,
            contactPerson: row.contactPerson,
            contactMobile: row.contactMobile
          },
          role: {
            id: row.roleId,
            title: row.roleTitle,
            mohallah: row.mohallah_name || null,
            permissions: {
              add: !!row.canAdd,
              edit: !!row.canEdit,
              view: !!row.canView,
              delete: !!row.canDelete
            }
          }
        });
      }
      return acc;
    }, {});

    // 5) attach roles to each user
    const enriched = users.map(u => ({
      profile: u,
      roles: rolesByUser[u.UsrID]
        ? Array.from(rolesByUser[u.UsrID].values())
        : []
    }));

    // 6) build filter options for the front end
    const filters = {
      organizations: [...new Set(userRoles.map(r => r.compName))].sort(),
      roles: [...new Set(userRoles.map(r => r.roleTitle))].sort()
    };

    // 7) send one payload
    res.json({
      meta: {
        totalCount: cnt
      },
      filters,
      users: enriched
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enriched profiles' });
  }
});

// Get all user profiles with roles
// app.get('/api/get-user-list', async (req, res) => {
//   try {
//     // paging params (optional)
//     const page = 1;
//     const perPage = 500;
//     const offset = (page - 1) * perPage;

//     // 1) total count
//     const [[{ cnt }]] = await pool.query(
//       `SELECT COUNT(*) AS cnt FROM owsadmUsrProfil`
//     );

//     // 2) fetch page of users, including extra fields
//     const [users] = await pool.query(`
//       SELECT
//         u.UsrID,
//         u.UsrITS,
//         u.UsrName             AS name,
//         u.UsrLogin            AS login,
//         u.UsrMobile           AS mobile,
//         u.UsrMohalla          AS mohalla,
//         u.UsrDesig            AS designation,
//         u.UsrEmail            AS email,
//         u.UsrPwd              AS password,
//         u.CoordinatorMohalla  AS coordinatorMohalla,
//         u.CrOn                AS createdAt,
//         u.EditOn              AS updatedAt
//       FROM owsadmUsrProfil AS u
//       ORDER BY u.UsrName
//       LIMIT ? OFFSET ?
//     `, [perPage, offset]);

//     // 3) fetch *only real* roles + permissions + enriched company
//     const [userRoles] = await pool.query(`
//       SELECT
//         ur.UsrID,
//         ur.CompID              AS compId,
//         ur.mohallah_name       AS mohallah_name,
//         c.CompName             AS compName,
//         c.CompAddress          AS address,
//         c.ContactPerson        AS contactPerson,
//         c.ContactMobile        AS contactMobile,
//         rm.RId                 AS roleId,
//         rm.RTitle              AS roleTitle,
//         rm.\`Add\`     AS canAdd,
//         rm.\`Edit\`    AS canEdit,
//         rm.\`View\`    AS canView,
//         rm.\`Delete\`  AS canDelete
//       FROM owsadmUsrRole AS ur
//       JOIN owsadmRoleMas  AS rm ON rm.RId = ur.RID
//       JOIN owsadmComp     AS c  ON c.Comp   = ur.CompID
//       WHERE
//         ur.UsrID IN (?)
//         AND rm.RId IS NOT NULL
//     `, [users.map(u => u.UsrID)]);

//     // 4) group roles by user, dedupe
//     const rolesByUser = userRoles.reduce((acc, row) => {
//       const uid = row.UsrID;
//       if (!acc[uid]) acc[uid] = new Map();
//       const key = `${row.compId}_${row.roleId}`;
//       if (!acc[uid].has(key)) {
//         acc[uid].set(key, {
//           company: {
//             id: row.compId,
//             name: row.compName,
//             address: row.address,
//             contactPerson: row.contactPerson,
//             contactMobile: row.contactMobile
//           },
//           role: {
//             id: row.roleId,
//             title: row.roleTitle,
//             mohallah: row.mohallah_name || null,
//             permissions: {
//               add: !!row.canAdd,
//               edit: !!row.canEdit,
//               view: !!row.canView,
//               delete: !!row.canDelete
//             }
//           }
//         });
//       }
//       return acc;
//     }, {});

//     // 5) attach roles to each user
//     const enriched = users.map(u => ({
//       profile: u,
//       roles: rolesByUser[u.UsrID]
//         ? Array.from(rolesByUser[u.UsrID].values())
//         : []
//     }));

//     // 6) build filter options for the front end
//     const filters = {
//       organizations: [...new Set(userRoles.map(r => r.compName))].sort(),
//       roles: [...new Set(userRoles.map(r => r.roleTitle))].sort()
//     };

//     // 7) send one payload
//     res.json({
//       meta: {
//         totalCount: cnt,
//         page,
//         perPage
//       },
//       filters,
//       users: enriched
//     });
//   }
//   catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch enriched profiles' });
//   }
// });

app.get('/api/get-user-list', async (req, res) => {
  try {
    // 1) fetch all users
    const [users] = await pool.query(`
      SELECT
        COALESCE(u.UsrID, 0)            AS UsrID,
        u.UsrITS                         AS UsrITS,
        u.UsrName                        AS name,
        u.UsrLogin                       AS login,
        u.UsrMobile                      AS mobile,
        TRIM(COALESCE(u.UsrMohalla, '')) AS mohalla,
        TRIM(COALESCE(u.UsrDesig, ''))   AS designation,
        COALESCE(u.UsrEmail, '')         AS email,
        COALESCE(u.UsrPwd, '')           AS password,
        TRIM(COALESCE(u.CoordinatorMohalla, '')) AS coordinatorMohalla,
        u.CrOn                           AS createdAt,
        u.EditOn                         AS updatedAt
      FROM owsadmUsrProfil AS u
      ORDER BY u.UsrName
    `);

    const cnt = users.length;

    // 3) roles + perms + company
    const [userRoles] = await pool.query(`
      SELECT
        COALESCE(ur.UsrID, 0)           AS UsrID,
        COALESCE(ur.CompID, 0)          AS compId,
        TRIM(COALESCE(ur.mohallah_name, '')) AS mohallah_name,
        TRIM(COALESCE(c.CompName, ''))  AS compName,
        c.CompAddress                   AS address,
        c.ContactPerson                 AS contactPerson,
        c.ContactMobile                 AS contactMobile,
        COALESCE(rm.RId, 0)             AS roleId,
        TRIM(COALESCE(rm.RTitle, ''))   AS roleTitle,
        rm.\`Add\`  AS canAdd,
        rm.\`Edit\` AS canEdit,
        rm.\`View\` AS canView,
        rm.\`Delete\` AS canDelete
      FROM owsadmUsrRole AS ur
      JOIN owsadmRoleMas  AS rm ON rm.RId = ur.RID
      JOIN owsadmComp     AS c  ON c.Comp   = ur.CompID
      WHERE ur.UsrID IN (?)
    `, [users.map(u => u.UsrID)]);

    // group + attach (unchanged)
    const rolesByUser = userRoles.reduce((acc, row) => {
      const uid = row.UsrID;
      if (!acc[uid]) acc[uid] = new Map();
      const key = `${row.compId}_${row.roleId}`;
      if (!acc[uid].has(key)) {
        acc[uid].set(key, {
          company: {
            id: row.compId,
            name: row.compName,
            address: row.address,
            contactPerson: row.contactPerson,
            contactMobile: row.contactMobile
          },
          role: {
            id: row.roleId,
            title: row.roleTitle,
            mohallah: row.mohallah_name || null,
            permissions: {
              add: !!row.canAdd,
              edit: !!row.canEdit,
              view: !!row.canView,
              delete: !!row.canDelete
            }
          }
        });
      }
      return acc;
    }, {});

    const enriched = users.map(u => ({
      profile: u,
      roles: rolesByUser[u.UsrID]
        ? Array.from(rolesByUser[u.UsrID].values())
        : []
    }));

    res.json({
      meta: { totalCount: cnt },
      filters: {
        organizations: [...new Set(userRoles.map(r => r.compName))].sort(),
        roles: [...new Set(userRoles.map(r => r.roleTitle))].sort()
      },
      users: enriched
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch enriched profiles' });
  }
});

//Create User Profile
app.post('/api/create-user-profile', async (req, res) => {
  const {
    UsrID, UsrITS, UsrName, UsrLogin, UsrPwd,
    UsrMobile, UsrMohalla, UsrDesig, CoordinatorMohalla,
    CreatedBy
  } = req.body;

  const now = new Date();

  try {

    const [rows] = await pool.query(`SELECT MAX(UsrID) AS maxId FROM owsadmUsrProfil`);
    const nextUsrID = (rows[0].maxId || 0) + 1;

    await pool.query(`
      INSERT INTO owsadmUsrProfil (
        UsrID, UsrITS, UsrName, UsrLogin, UsrPwd,
        UsrMobile, UsrMohalla, UsrDesig, CoordinatorMohalla,
        CrBy, CrOn, EditBy, EditOn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nextUsrID, UsrITS, UsrName, UsrLogin, UsrPwd,
      UsrMobile, UsrMohalla,
      UsrDesig || null,            // allow null
      CoordinatorMohalla || null, // allow null
      CreatedBy, now, CreatedBy, now,
    ]);

    res.send({ success: true });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).send({ success: false });
  }
});

// Assign user a role
app.post('/api/assign-user-role', async (req, res) => {

  console.log('Assigning user role:', req.body);
  const {
    UsrID, RID, CompID,
    URCrBy, mohallah_name
  } = req.body;

  const now = new Date();

  try {
    await pool.query(`
      INSERT INTO owsadmUsrRole (
        SysTag, UsrID, RID, CompID,
        URCrBy, URCrOn, UREditBy, UREditOn,mohallah_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
    `, [
      'ows', UsrID, RID, CompID,
      URCrBy, now, URCrBy, now, mohallah_name
    ]);

    res.send({ success: true });
  } catch (err) {
    console.error('Assign role error:', err);
    res.status(500).send({ success: false });
  }
});

// GET /api/companies
app.get('/api/get-companies', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        Comp AS compID,
        CompName AS compName,
        CompAddress AS compAddress,
        ContactPerson AS contactPerson,
        ContactMobile AS contactMobile,
        cEmail AS cEmail
      FROM owsadmComp
      ORDER BY CompName ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:usrId', async (req, res) => {
  const { usrId } = req.params;
  try {
    // 1. Profile
    const [[profile]] = await pool.query(
      `SELECT 
         u.UsrID, u.UsrITS, u.UsrName, u.UsrLogin, u.UsrMobile,
         u.UsrMohalla, u.UsrDesig, u.CoordinatorMohalla,
         u.CrBy AS createdBy, u.CrOn AS createdOn,
         u.EditBy AS editedBy, u.EditOn AS editedOn
       FROM owsadmUsrProfil u
       WHERE u.UsrID = ?`,
      [usrId]
    );
    if (!profile) return res.status(404).json({ error: 'User not found' });

    // 2. Role & company assignment
    const [[assignment]] = await pool.query(
      `SELECT r.RID AS roleId, rm.RTitle AS roleTitle,
              c.Comp AS compId, c.CompName AS compName
       FROM owsadmUsrRole r
       LEFT JOIN owsadmRoleMas rm ON r.RID = rm.RId
       LEFT JOIN owsadmComp c ON r.CompID = c.Comp
       WHERE r.UsrID = ?`,
      [usrId]
    );

    res.json({ profile, assignment: assignment || null });
  } catch (err) {
    console.error('Fetch single user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:usrId
app.put('/api/users/:usrId', async (req, res) => {
  const { usrId } = req.params;
  const {
    UsrITS, UsrName, UsrLogin, UsrPwd,
    UsrMobile, UsrMohalla, UsrDesig, CoordinatorMohalla,
    UsrEmail,
    EditedBy
  } = req.body;

  const now = new Date();
  try {
    // If password is present, hash it
    //let pwdClause = '', params = [];
    // if (UsrPwd) {
    //   const hash = await bcrypt.hash(UsrPwd, 12);
    //   pwdClause = ', UsrPwd = ?';
    //   params.push(hash);
    // }

    // Build and run UPDATE
    const sql = `
      UPDATE owsadmUsrProfil
      SET UsrITS = ?, UsrName = ?, UsrLogin = ?, UsrPwd = ?,UsrEmail = ?,
          UsrMobile = ?, UsrMohalla = ?, UsrDesig = ?,
          CoordinatorMohalla = ?, EditBy = ?, EditOn = ?, UsrEmail = ?
      WHERE UsrID = ?
    `;
    params = [
      UsrITS, UsrName, UsrLogin, UsrPwd,
      UsrMobile, UsrMohalla, UsrDesig || null,
      CoordinatorMohalla || null,
      EditedBy, now, UsrEmail,
      usrId
    ];

    await pool.query(sql, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Update user profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:usrId/role
app.put('/api/users/:usrId/role', async (req, res) => {
  const { usrId } = req.params;
  const { RID, CompID, EditedBy } = req.body;
  const now = new Date();

  try {
    // Check if an assignment exists
    const [[existing]] = await pool.query(
      `SELECT Id FROM owsadmUsrRole WHERE UsrID = ?`,
      [usrId]
    );

    if (existing) {
      // Update
      await pool.query(
        `UPDATE owsadmUsrRole
         SET RID = ?, CompID = ?, UREditBy = ?, UREditOn = ?
         WHERE UsrID = ?`,
        [RID, CompID || null, EditedBy, now, usrId]
      );
    } else {
      // Insert fresh
      await pool.query(
        `INSERT INTO owsadmUsrRole
         (SysTag, UsrID, RID, CompID, URCrBy, URCrOn, UREditBy, UREditOn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['ows', usrId, RID, CompID || null, EditedBy, now, EditedBy, now]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Change user role error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:usrId
app.delete('/api/users/:usrId', async (req, res) => {
  const { usrId } = req.params;
  try {
    // Delete role first (foreign key safety)
    await pool.query(
      `DELETE FROM owsadmUsrRole WHERE UsrID = ?`,
      [usrId]
    );
    // Then profile
    await pool.query(
      `DELETE FROM owsadmUsrProfil WHERE UsrID = ?`,
      [usrId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/users-by-role-company', async (req, res) => {
  const { compId, roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ message: 'Missing roleId' });
  }

  // Base query
  let query = `
  SELECT 
    up.UsrID,
    up.UsrITS,
    up.UsrName,
    oc.CompName
  FROM owsadmUsrProfil up
  JOIN owsadmUsrRole ur ON up.UsrID = ur.UsrID
  LEFT JOIN owsadmComp oc ON ur.CompID = oc.Comp
  WHERE ur.RID = ?
`;
  const params = [roleId];

  // Conditionally filter by company if compId is provided
  if (compId) {
    query += ' AND ur.CompID = ?';
    params.push(compId);
  }

  try {
    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No users found for given role and company.' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error fetching users by role & company:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE assignment
app.post('/delete-assigned', async (req, res) => {
  const { reqId } = req.body;

  if (!reqId) {
    return res.status(400).json({ message: 'Missing reqId' });
  }

  try {
    // Step 1: Clear assignment in main request
    await OwsReqForm.update(
      { assignedTo: null },         // set to NULL in DB
      { where: { reqId } }
    );

    // Step 2: (optional) insert into history
    // await owsReqAssignHistory.create({
    //   reqId,
    //   assignedTo: null,
    //   assignedBy: req.user?.id,   // or whoever triggered the delete
    //   assignedOn: new Date(),
    // });

    console.log('Assignment deleted:', { reqId });

    res.status(200).json({ message: 'Assignment cleared.' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Assign to a user (sets assignedTo and logs history)
app.post('/update-assigned', async (req, res) => {
  const { reqId, assignedTo, assignedBy, notes } = req.body;
  if (!reqId || !assignedTo || !assignedBy) {
    return res.status(400).json({ message: 'Missing required fields (reqId, assignedTo, assignedBy)' });
  }

  try {
    await sequelize.transaction(async (t) => {
      await OwsReqForm.update({ assignedTo }, { where: { reqId }, transaction: t });
      await OwsReqFormAssignmentHistory.create({
        reqId,
        assignedTo,
        assignedBy,
        notes: notes ?? 'ASSIGNED'
      }, { transaction: t });
    });
    res.status(200).json({ message: 'Assignment updated and logged.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unassign (clears main table, logs previous assignee in history)
app.post('/delete-assigned', async (req, res) => {
  const { reqId, assignedBy, notes } = req.body;
  if (!reqId || !assignedBy) {
    return res.status(400).json({ message: 'Missing required fields (reqId, assignedBy)' });
  }

  try {
    await sequelize.transaction(async (t) => {
      const row = await OwsReqForm.findOne({ where: { reqId }, transaction: t, lock: t.LOCK.UPDATE });
      const previous = row?.assignedTo;
      if (!previous) return; // nothing to clear

      await OwsReqForm.update({ assignedTo: null }, { where: { reqId }, transaction: t });

      await OwsReqFormAssignmentHistory.create({
        reqId,
        assignedTo: previous,
        assignedBy,
        notes: notes ?? 'UNASSIGNED'
      }, { transaction: t });
    });
    res.status(200).json({ message: 'Assignment cleared and logged.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const OwsReqFormStatusHistory = require('./models/OwsReqFormStatusHistory.model.js');
const OwsStatusRequiredDocs = require('./models/OwsStatusRequiredDocs.model.js');

// POST /status/latest-remarks
app.post('/latest-remarks', async (req, res) => {
  try {
    const { reqId } = req.body;

    if (!reqId) {
      return res.status(400).json({ message: 'Missing reqId in request body.' });
    }

    const latestStatus = await OwsReqFormStatusHistory.findOne({
      where: { reqId },
      order: [['changedAt', 'DESC']],
      include: [
        {
          model: OwsStatusRequiredDocs,
          as: 'requiredDocuments',
          attributes: ['documentName']
        }
      ]
    });

    if (!latestStatus) {
      return res.status(404).json({ message: 'No status found for this request.' });
    }

    res.json({
      reqId: latestStatus.reqId,
      currentStatus: latestStatus.newStatus,
      updatedAt: latestStatus.changedAt,
      remarks: latestStatus.remarks,
      requiredDocuments: latestStatus.requiredDocuments.map(doc => doc.documentName)
    });
  } catch (err) {
    console.error('Error fetching latest status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/status-update', async (req, res) => {
  const { reqId, newStatus, changedByITS, remarks, requiredDocuments = [] } = req.body;

  if (!reqId || !newStatus || !changedByITS) {
    return res.status(400).json({ message: 'Missing required fields: reqId, newStatus, or changedByITS' });
  }

  try {
    // Step 1: Get old status from latest history
    const lastStatus = await OwsReqFormStatusHistory.findOne({
      where: { reqId },
      order: [['changedAt', 'DESC']]
    });

    const oldStatus = lastStatus ? lastStatus.newStatus : null;

    // Step 2: Create new status history entry
    const newStatusEntry = await OwsReqFormStatusHistory.create({
      reqId,
      oldStatus,
      newStatus,
      changedByITS,
      remarks
    });

    // Step 3: Add required documents (if any)
    if (requiredDocuments.length > 0) {
      const docsToInsert = requiredDocuments.map(doc => ({
        statusHistoryId: newStatusEntry.id,
        documentName: doc
      }));

      await OwsStatusRequiredDocs.bulkCreate(docsToInsert);
    }

    //Optional: Update the current status in main owsReqForm table
    const form = await OwsReqForm.findByPk(reqId);
    if (form) {
      form.currentStatus = newStatus;
      await form.save();
    }

    return res.status(201).json({
      message: 'Status updated and history recorded successfully.',
      statusHistoryId: newStatusEntry.id
    });
  } catch (err) {
    console.error('Error updating status:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Define associations AFTER models are loaded
OwsReqFormStatusHistory.hasMany(OwsStatusRequiredDocs, {
  foreignKey: 'statusHistoryId',
  as: 'requiredDocuments'
});

OwsStatusRequiredDocs.belongsTo(OwsReqFormStatusHistory, {
  foreignKey: 'statusHistoryId'
});

module.exports = {
  OwsReqFormStatusHistory,
  OwsStatusRequiredDocs,
};

const MODEL_MAP = {
  financial_survey: FinancialSurvey,
  financial_survey_fee: FinancialSurveyFee,
  financial_survey_goods: FinancialSurveyGoods,
  financial_year: FinancialYear,
  institute_category: InstituteCategory,
  mohallah: Mohallah,
  student_institute: StudentInstitute,
  student_fee: StudentFee,
  fee_type: FeeType,
  class: Class,
  school: School,
  section: Section,
};

// generic “get all” endpoint
app.get('/api/get-aiut-table/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const model = MODEL_MAP[tableName];

  if (!model) {
    return res.status(400).json({ error: `Unknown table: ${tableName}` });
  }

  try {
    const rows = await model.findAll();
    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

async function selectAllFromAiutTable(tableName) {
  // Basic validation: only allow letters, numbers, and underscores
  if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
    throw new Error('Invalid table name');
  }

  // ?? is the placeholder for identifiers in mysql2
  const [rows] = await aiutpool.query('SELECT * FROM ??', [tableName]);
  return rows;
}


app.get('/api/aiut/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const rows = await selectAllFromAiutTable(tableName);
    res.json(rows);
  } catch (err) {
    console.error('Error querying table:', err);
    res.status(400).json({ error: err.message });
  }
});

// async function populateStudentGoods(financial_survey_id, student_id, assetsOptions, created_by_id) {
//   console.log('⚙️  populateStudentGoods start', {
//     financial_survey_id,
//     student_id,
//     assetsOptions,
//     created_by_id
//   });

//   // 1) Map of known asset names → goods_id
//   const assetsToGoodsId = {
//     "Gas Stove": null,
//     "TV": 1,
//     "Radio": null,
//     "Telephone/Mobile": 10,
//     "Animal Cart": null,
//     "Bicycle": 11,
//     "Computer/Laptop": 8,
//     "Motorbike": 12,
//     "Refrigerator": 2,
//     "Washing Machine": 4,
//     "Car": 13,
//     "Truck": 14
//   };
//   console.log('🔑 assetsToGoodsId map:', assetsToGoodsId);

//   // 2) Normalize helper
//   const normalize = str => str.trim().toLowerCase();

//   // 3) Build set of selected goods_ids
//   const selectedGoodsIds = new Set();
//   for (const opt of assetsOptions) {
//     console.log('🔍 checking asset option:', opt);
//     if (!opt.name) {
//       console.log('  ⛔ skipping empty name');
//       continue;
//     }
//     const key = normalize(opt.name);
//     const gid = assetsToGoodsId[opt.name] ?? assetsToGoodsId[key];
//     console.log(`  ↳ name="${opt.name}", normalized="${key}" → gid=${gid}`);
//     if (gid != null) {
//       selectedGoodsIds.add(gid);
//       console.log(`  ✅ added goods_id ${gid}`);
//     }
//   }
//   console.log('🎯 selectedGoodsIds set:', Array.from(selectedGoodsIds));

//   // 4) Fetch all master goods
//   const masterGoods = await Goods.findAll({ attributes: ['goods_id'] });
//   console.log(`📋 fetched masterGoods (${masterGoods.length} items):`, masterGoods.map(g => g.goods_id));

//   const now = new Date();
//   const inserted = [];

//   // 5) Loop and insert
//   for (const g of masterGoods) {
//     const status = selectedGoodsIds.has(g.goods_id) ? 'yes' : 'no';
//     console.log(`✏️ inserting StudentGoods for goods_id=${g.goods_id}, status=${status}`);
//     try {
//       const row = await FinancialSurveyGoods.create({
//         //financial_survey_goods_id: uuidv4(),
//         financial_survey_id,
//         student_id,
//         goods_id: g.goods_id,
//         status,
//         comment: '',
//         created_at: now,
//         created_by_id
//       });
//       inserted.push(row);
//       console.log('  ✔️ inserted:', row.toJSON());
//     } catch (err) {
//       console.error(`  ❌ failed to insert for goods_id=${g.goods_id}:`, err);
//     }
//   }

//   console.log('🏁 populateStudentGoods done, total inserted:', inserted.length);
//   return inserted;
// }

// GET: List of all Mohallah names
app.get('/api/mohallah-names', async (req, res) => {
  try {
    const conn = await aiutpool.getConnection();
    const [rows] = await conn.query(
      `SELECT mohallah_id, mohallah_name FROM mohallah ORDER BY mohallah_name`
    );

    const names = rows.map(row => row.mohallah_name);

    res.json({ success: true, data: names });
  } catch (err) {
    console.error('❌ Error fetching mohallah names:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function insertAiutSurvey(applicationId, aiutSurvey) {
  const conn = await aiutpool.getConnection();
  try {
    await conn.beginTransaction();
    console.log(`[insertAiutSurvey] BEGIN TX for applicationId=${applicationId}`);

    let aiut_student_status = 'Old';

    // 1) Load the OWS request form
    const owsForm = await OwsReqForm.findOne({ where: { ITS: aiutSurvey.its_no } });
    if (!owsForm) throw new Error(`No OwsReqForm for ITS=${aiutSurvey.its_no}`);
    console.log('[1] owsForm loaded');

    // 2) Count dependents & income types
    const [countRows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM dependents   WHERE application_id = ?) AS dependent_count,
         (SELECT COUNT(*) FROM income_types WHERE application_id = ?) AS income_count`,
      [applicationId, applicationId]
    );
    const { dependent_count, income_count } = countRows[0];
    console.log(`[2] dependents=${dependent_count}, income=${income_count}`);

    // 3) Sum father’s income; fallback to mother’s
    let totalIncome = 0;
    const [[{ total_income: dadIncome }]] = await pool.query(
      `SELECT SUM(amount) AS total_income
         FROM income_types
        WHERE application_id = ? AND member_its = ?`,
      [applicationId, aiutSurvey.father_its_no]
    );
    if (dadIncome != null) {
      totalIncome = dadIncome;
      console.log('[3] father income:', totalIncome);
    } else {
      const [[{ total_income: momIncome }]] = await pool.query(
        `SELECT SUM(amount) AS total_income
           FROM income_types
          WHERE application_id = ? AND member_its = ?`,
        [applicationId, aiutSurvey.mother_its_no]
      );
      totalIncome = momIncome || 0;
      console.log('[3] mother income:', totalIncome);
    }

    // 4) Find or insert Student
    // Inside your async function where `conn`, `aiutSurvey`, `owsForm`, `totalIncome`, `income_count`, `dependent_count`,
    // `toMySQLDatetime`, and `uuidv4` are all in scope:

    let student;
    {
      // 1) Try to find an existing student by ITS
      const [[existing]] = await conn.query(
        `SELECT student_id, student_no FROM student WHERE its_no = ?`,
        [aiutSurvey.its_no]
      );

      if (existing) {
        // 2) Mark as old
        aiut_student_status = 'Old';

        // 3) Re-lookup mohalla_id in case it changed
        const [[{ mohallah_id }]] = await conn.query(
          `SELECT mohallah_id FROM mohallah WHERE mohallah_name = ?`,
          [owsForm.mohalla]
        );

        // 4) Assemble all fields you want to refresh
        const updateFields = {
          student_name: aiutSurvey.student_name,
          surname: aiutSurvey.surname,
          dob: aiutSurvey.dob,
          user_image: aiutSurvey.user_image,
          father_its_no: aiutSurvey.father_its_no,
          father_name: aiutSurvey.father_name,
          father_mobile_no: aiutSurvey.father_mobile_no,
          father_occupation_id: 0,
          father_cnic: aiutSurvey.father_cnic,
          mother_its_no: aiutSurvey.mother_its_no,
          mother_name: aiutSurvey.mother_name,
          mother_mobile_no: aiutSurvey.mother_mobile_no,
          mother_occupation_id: 0,
          residential_address: aiutSurvey.residential_address,
          residential_phone_no: aiutSurvey.residential_phone_no,
          mohallah_id,          // from query above
          gender: aiutSurvey.gender,
          status: "Active",
          delete_request: null,
          madrassa_going: "Yes",
          madrassa_id: 0,
          finance_support: "Inactive",
          fa_date: null,
          employer_name: "",
          monthly_income: totalIncome,
          earning_members: income_count,
          dependents: dependent_count,
          flat_area: 0,
          modified_at: toMySQLDatetime(),
          modified_by_id: 1
          // (we leave student_id, student_no, its_no, created_at, created_by_id intact)
        };

        // 5) Run the UPDATE
        await conn.query(
          `UPDATE student 
          SET ? 
        WHERE student_id = ?`,
          [updateFields, existing.student_id]
        );

        // 6) Preserve the existing keys for downstream logic
        student = {
          student_id: existing.student_id,
          student_no: existing.student_no
        };
        console.log('[4] updated existing student:', student);

      } else {
        // New‐student path
        aiut_student_status = 'New';

        // 7) Determine next student_no
        const [[{ maxno }]] = await conn.query(
          `SELECT MAX(student_no) AS maxno FROM student`
        );
        const newNo = (maxno || 0) + 1;
        const newId = uuidv4();

        // 8) Lookup mohallah_id
        const [[{ mohallah_id }]] = await conn.query(
          `SELECT mohallah_id FROM mohalla WHERE mohallah_name = ?`,
          [owsForm.mohalla]
        );

        // 9) INSERT all fields
        await conn.query('INSERT INTO student SET ?', [{
          student_id: newId,
          student_no: newNo,
          its_no: aiutSurvey.its_no,
          ref_app: "OWS",
          student_name: aiutSurvey.student_name,
          surname: aiutSurvey.surname,
          dob: aiutSurvey.dob,
          user_image: aiutSurvey.user_image,
          father_its_no: aiutSurvey.father_its_no,
          father_name: aiutSurvey.father_name,
          father_mobile_no: aiutSurvey.father_mobile_no,
          father_occupation_id: 0,
          father_cnic: aiutSurvey.father_cnic,
          mother_its_no: aiutSurvey.mother_its_no,
          mother_name: aiutSurvey.mother_name,
          mother_mobile_no: aiutSurvey.mother_mobile_no,
          mother_occupation_id: 0,
          residential_address: aiutSurvey.residential_address,
          residential_phone_no: aiutSurvey.residential_phone_no,
          mohallah_id,
          gender: aiutSurvey.gender,
          status: "Active",
          delete_request: null,
          madrassa_going: "Yes",
          madrassa_id: 0,
          finance_support: "Inactive",
          fa_date: null,
          employer_name: "",
          monthly_income: totalIncome,
          earning_members: income_count,
          dependents: dependent_count,
          flat_area: 0,
          created_at: toMySQLDatetime(),
          created_by_id: 1,
          modified_at: null,
          modified_by_id: null
        }]);

        // 10) Record the new keys
        student = { student_id: newId, student_no: newNo };
        console.log('[4] inserted new student:', student);
      }
    }

    // 5) Ensure StudentInstitute
    let financialYearId;
    {
      const [[fy]] = await conn.query(
        `SELECT financial_year_id FROM financial_year ORDER BY financial_year_id DESC LIMIT 1`
      );
      financialYearId = fy.financial_year_id;
    }
    const [[inst]] = await conn.query(
      `SELECT 1 FROM student_institute WHERE student_id = ? AND financial_year_id = ?`,
      [student.student_id, financialYearId]
    );
    if (!inst) {
      // get or create school
      let schoolId;
      const [[school]] = await conn.query(
        `SELECT school_id FROM school WHERE school_name = ?`,
        [owsForm.institution]
      );
      if (school) {
        schoolId = school.school_id;
      } else {
        schoolId = uuidv4();
        await conn.query('INSERT INTO school SET ?', [{
          schoolId,
          institute_category_id: 0,
          school_category: "",
          school_name: owsForm.institution,
          created_at: new Date(),
          created_by_id: 1
        }]);
      }
      // insert institute
      await conn.query('INSERT INTO student_institute SET ?', [{
        student_institute_id: uuidv4(),
        financial_year_id: financialYearId,
        student_id: student.student_id,
        institute_category_id: 0,
        schoolId,
        class_id: 0,
        section_id: 0,
        created_by_id: 1,
        created_at: new Date()
      }]);
      console.log('[5] StudentInstitute created');
    }

    // 6) Insert Survey
    await conn.query('INSERT INTO survey SET ?', [{
      ...aiutSurvey,
      student_id: student.student_id,
      student_no: student.student_no,
      created_at: toMySQLDatetime(),
      modified_at: null
    }]);
    console.log('[6] survey inserted');

    // 7) Create FinancialSurvey
    let finSurveyId = uuidv4();

    // 1) Prepare your data objects
    const insertData = {
      financial_survey_id: finSurveyId,
      student_id: student.student_id,
      monthly_income: totalIncome,
      earning_members: income_count,
      dependents: dependent_count,
      flat_area: owsForm.flat_area || "",
      employer_name: owsForm.employer_name || "",
      student_status: aiut_student_status,
      status: "Request",
      ref_app: "OWS",
      created_by_id: 1,
      created_at: new Date()
    };

    const updateData = {
      monthly_income: totalIncome,
      earning_members: income_count,
      dependents: dependent_count,
      student_status: aiut_student_status,
      status: "Request",
      ref_app: "OWS"
      //updated_at: new Date()
    };

    // 2) Check if a survey already exists for this student
    const [rows] = await conn.query(
      'SELECT financial_survey_id FROM financial_survey WHERE student_id = ?',
      [student.student_id]
    );

    if (rows.length > 0) {
      // 3a) Found an existing record → UPDATE
      finSurveyId = rows[0].financial_survey_id; // use existing ID
      await conn.query(
        `UPDATE financial_survey 
         SET monthly_income   = ?,
             earning_members  = ?,
             dependents       = ?,
             student_status   = ?,
             status           = ?,
              ref_app         = ?
       WHERE student_id = ?`,
        [
          updateData.monthly_income,
          updateData.earning_members,
          updateData.dependents,
          updateData.student_status,
          updateData.status,
          updateData.ref_app,
          //updateData.updated_at,
          student.student_id
        ]
      );
      console.log('[7] FinancialSurvey updated for student', student.student_id);

    } else {
      // 3b) No record found → INSERT
      await conn.query(
        'INSERT INTO financial_survey SET ?',
        [insertData]
      );
      console.log('[7] FinancialSurvey created with id', finSurveyId);
    }

    {
      console.log(applicationId);
      const [rows] = await pool.query(
        `SELECT assets FROM application_main WHERE id = ?`,
        [applicationId]
      );

      const assets = rows.length ? rows[0].assets : null;

      // Optional: throw an error or handle missing record
      if (assets === null) {
        throw new Error(`No application_main record found for id ${applicationId}`);
      }
      const selected = (assets || "")
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      const [goods] = await conn.query(`SELECT goods_id, LOWER(description) AS name FROM goods`);
      for (const g of goods) {
        await conn.query('INSERT INTO financial_survey_goods SET ?', [{
          //financial_survey_goods_id: uuidv4(),
          financial_survey_id: finSurveyId,
          //student_id: student.student_id,
          goods_id: g.goods_id,
          status: selected.includes(g.name) ? 'yes' : 'no',
          comment: '',
          created_at: new Date(),
          created_by_id: 1
        }]);
      }
      console.log('[10] StudentGoods populated');
    }

    await conn.commit();
    console.log('[insertAiutSurvey] COMMIT TX');
    return {
      studentId: student.student_id,
      financialSurveyId: finSurveyId
    };
  } catch (err) {
    await conn.rollback();
    console.error('[insertAiutSurvey] ROLLBACK TX due to:', err);
    throw err;
  } finally {
    conn.release();
  }
}

app.delete('/api/aiut/:tableName/:columnName/:value', async (req, res) => {
  const { tableName, columnName, value } = req.params;

  // ⚠️ Basic validation against SQL-injection for identifiers
  if (!/^[A-Za-z0-9_]+$/.test(tableName) || !/^[A-Za-z0-9_]+$/.test(columnName)) {
    return res.status(400).json({ error: 'Invalid table or column name' });
  }

  try {
    // Use parameterized identifiers (??) and values (?) 
    const [result] = await aiutpool.query(
      'DELETE FROM ?? WHERE ?? = ?',
      [tableName, columnName, value]
    );

    return res.json({
      table: tableName,
      column: columnName,
      value,
      deletedRows: result.affectedRows
    });
  } catch (err) {
    console.error('Error deleting rows:', err);
    return res.status(500).json({ error: err.message });
  }
});

const OTP_STORE = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Missing "phone" in request body' });
  }

  phone = phone.replace(/\D/g, ""); // keeps only digits

  // If there's an existing OTP for this phone, clear its removal timer
  const existing = OTP_STORE.get(phone);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }

  // 1) Generate new OTP
  const code = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;

  // 2) Schedule auto‐deletion when it expires
  const timeoutId = setTimeout(() => {
    OTP_STORE.delete(phone);
  }, OTP_TTL_MS);

  // 3) Store the new OTP record (overwrites any old one)
  OTP_STORE.set(phone, { code, expiresAt, timeoutId });

  // 4) Send via WaAPI
  const chatId = `${phone}@c.us`;
  const url = "https://waapi.app/api/v1/instances/5164/client/action/send-message";
  const token = "N4g8hLGka0cRFSP9DfU8HMA5F3cxccbYjVzMSO8H4b38d73f";
  const payload = { chatId, message: `Your verification code is: *${code}*` };
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    await axios.post(url, payload, { headers });
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const record = OTP_STORE.get(phone);

  // Clean up expired on‐the‐fly
  if (record?.expiresAt <= Date.now()) {
    clearTimeout(record.timeoutId);
    OTP_STORE.delete(phone);
    return res.status(400).json({ success: false, message: 'Expired OTP' });
  }

  if (record && record.code === otp) {
    clearTimeout(record.timeoutId);
    OTP_STORE.delete(phone);
    return res.json({ success: true, message: 'OTP verified' });
  }

  res.status(400).json({ success: false, message: 'Invalid OTP' });
});

// Change Password
app.post('/api/change-password', async (req, res) => {
  const { login, newPassword } = req.body;

  // 1) Validate input
  if (!login || !newPassword) {
    return res
      .status(400)
      .json({ error: 'login and newPassword are all required' });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: 'newPassword must be at least 8 characters long' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // 2) Fetch current password
    const [rows] = await conn.query(
      'SELECT UsrPwd FROM owsadmUsrProfil WHERE UsrID = ? LIMIT 1',
      [login]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 4) Update to the new password
    await conn.query(
      'UPDATE owsadmUsrProfil SET UsrPwd = ? WHERE UsrLogin = ?',
      [newPassword, login]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error in change-password:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/sync-aiut-students', async (req, res) => {
  try {
    // 1) grab all AIUT forms (we only need reqId + ITS)
    const forms = await OwsReqForm.findAll({
      where: { organization: 'AIUT' },
      attributes: ['reqId', 'ITS']
    });

    let updatedCount = 0;
    const conn = await aiutpool.getConnection();

    for (const form of forms) {
      const itsValue = form.get('ITS');

      // 2) Find matching student
      const [[student]] = await conn.query(
        `SELECT student_id
           FROM student
          WHERE its_no = ?`,
        [itsValue]
      );

      // 3) If found, update the form row
      if (student && student.student_id) {
        await OwsReqForm.update(
          { aiut_student_id: student.student_id },
          { where: { reqId: form.get('reqId') } }
        );
        updatedCount++;
      }
    }

    conn.release();
    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('sync-aiut-students error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a single reusable transporter
const transporter = nodemailer.createTransport({
  host: "cloud313.corpservers.net",
  port: 587, // use 587 since you're using STARTTLS
  secure: false, // false for STARTTLS
  auth: {
    user: "noreply@attalimiyah.com.pk",
    pass: process.env.SMTP_PASS, // make sure this is set in your env
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false, // allows self-signed certs
  },
  connectionTimeout: 30_000, // 30 seconds
  greetingTimeout: 30_000,
  socketTimeout: 30_000,
  debug: true, // enable debug logs
});

// Quick health check
app.get('/health', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ ok: true, message: 'SMTP ready' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * POST /send-email
 * body: {
 *   to: "user@example.com" | ["a@b.com","c@d.com"],
 *   subject: "Hello",
 *   text?: "Plain text body",
 *   html?: "<p>HTML body</p>",
 *   cc?: string|string[],
 *   bcc?: string|string[],
 *   replyTo?: string,
 *   attachments?: [{ filename, content|path|href, contentType }]
 * }
 */
app.post('/send-email', async (req, res) => {
  try {
    const {
      to, subject, text, html,
      cc, bcc, replyTo, attachments
    } = req.body || {};

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        ok: false,
        error: 'Required: to, subject, and (text or html).',
      });
    }

    console.log(process.env.FROM_NAME);

    const mail = {
      from: {
        name: process.env.FROM_NAME || 'Mailer',
        address: process.env.FROM_EMAIL || process.env.SMTP_USER,
      },
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      replyTo,
      attachments, // pass-through if provided
    };

    const info = transporter.sendMail(mail);

    console.log('Email sent:', info);

    res.json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});