// const fs = require("fs");
// const path = require("path");
// const xlsx = require("xlsx");
// const bcrypt = require("bcryptjs");
// const User = require("../models/user.model"); 
// const Permission = require("../models/permission.model");

// // Read Excel File
// const filePath = path.join(__dirname, "users.xlsx");
// const workbook = xlsx.readFile(filePath);
// const sheetName = workbook.SheetNames[0];
// const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// // Define Constants
// const SALT_ROUNDS = 10;
// const MODULE_ID = 2;
// const FEATURE_VIEW = 6;
// const FEATURE_EDIT = 7;

// // Function to Convert ITS to String
// function formatITS(its) {
//   return its ? String(its).trim() : null; 
// }

// // Import Users from Excel
// async function importUsers() {
//   let added = 0, skipped = 0, failed = 0;

//   for (const row of data) {
//     try {
//       let { Name, ITS, Mohalla, Organization, User_Rights } = row;
      
//       ITS = formatITS(ITS); // Ensure ITS is a string

//       // Validate Data
//       if (!ITS || !Name) {
//         console.log(`Skipping invalid user: ${JSON.stringify(row)}`);
//         skipped++;
//         continue;
//       }

//       // Check if user already exists
//       const existingUser = await User.findOne({ where: { its_id: ITS } });
//       if (existingUser) {
//         console.log(`Skipping duplicate ITS ID: ${ITS}`);
//         skipped++;
//         continue;
//       }

//       // Hash Password
//       const hashedPassword = await bcrypt.hash(ITS, SALT_ROUNDS);

//       // Create User
//       const newUser = await User.create({
//         its_id: ITS,
//         role: "mini-admin",
//         name: Name,
//         email: `${ITS}@example.com`, // Default email pattern
//         password: hashedPassword,
//         mohalla: Mohalla || "Unknown",
//         umoor: Organization || null,
//       });

//       // Assign Permissions
//       const permissions = [];
//       if (User_Rights && User_Rights.includes("View")) {
//         permissions.push({ its_id: ITS, module_id: MODULE_ID, feature_id: FEATURE_VIEW });
//       }
//       if (User_Rights && User_Rights.includes("Edit")) {
//         permissions.push({ its_id: ITS, module_id: MODULE_ID, feature_id: FEATURE_EDIT });
//       }

//       if (permissions.length > 0) {
//         await Permission.bulkCreate(permissions);
//       }

//       console.log(`✔ User added: ${Name} (ITS: ${ITS})`);
//       added++;
//     } catch (error) {
//       console.error(`❌ Failed to add user (ITS: ${row.ITS}): ${error.message}`);
//       failed++;
//     }
//   }

//   console.log(`✅ Import Completed: ${added} added, ${skipped} skipped, ${failed} failed.`);
// }

// // Run Import
// importUsers();

// // const express = require("express");
// // const multer = require("multer");
// // const xlsx = require("xlsx");
// // const fs = require("fs");
// // const AiutRecord = require("../models/aiut_record.model"); // Import models
// // const AmbtRecord = require("../models/ambt_record.model"); // Import models
// // const StsmfRecord = require("../models/stsmf_record.model"); // Import models
// // const moment = require("moment");

// // const router = express.Router();

// // // Configure Multer for file uploads
// // const storage = multer.diskStorage({
// //     destination: (req, file, cb) => cb(null, "uploads/"),
// //     filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
// // });
// // const upload = multer({ storage: storage });

// // /**
// //  * ✅ Helper function to parse Excel file
// //  */
// // function parseExcel(filePath) {
// //     const workbook = xlsx.readFile(filePath);
// //     const sheetName = workbook.SheetNames[0];
// //     return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
// // }

// // /**
// //  * ✅ Helper function to sanitize "Amount" column (remove commas and convert to number)
// //  */
// // const sanitizeAmount = (amount) => {
// //   if (!amount) return 0;
// //   return parseFloat(amount.toString().replace(/,/g, "")) || 0;
// // };

// // /**
// //  * ✅ API: Upload Excel & Update AIUT Records
// //  */
// // router.post("/upload/aiut", upload.single("file"), async (req, res) => {
// //   try {
// //       const filePath = req.file.path;
// //       const workbook = xlsx.readFile(filePath);
// //       const sheet = workbook.Sheets[workbook.SheetNames[0]];
// //       const data = xlsx.utils.sheet_to_json(sheet);

// //       const records = data.map(row => ({
// //           org: row["org"] ?? "", // Ensure it's not undefined
// //           mohalla: row["mohalla"] ?? "",
// //           its: row["its"] ? row["its"].toString() : "", // Convert ITS to string safely
// //           sf: row["sf"] ? row["sf"].toString() : null, // Convert SF safely
// //           student: row["student"] ?? "",
// //           father: row["father"] ?? "",
// //           school: row["school"] ?? "",
// //           parents_p: row["parents_p"] ? parseInt(row["parents_p"]) : 0, // Convert to Integer
// //           org_p: row["org_p"] ? parseInt(row["org_p"]) : 0, // Convert to Integer
// //       }));

// //       await AiutRecord.bulkCreate(records);

// //       fs.unlinkSync(filePath); // Delete file after processing
// //       res.json({ message: "AIUT records uploaded successfully!", count: records.length });

// //   } catch (error) {
// //       console.error(error);
// //       res.status(500).json({ error: "Error processing AIUT Excel file." });
// //   }
// // });
// // /**
// //  * ✅ API: Upload Excel & Update AMBT Records
// //  */
// // router.post("/upload-ambt", upload.single("file"), async (req, res) => {
// //   try {
// //       if (!req.file) {
// //           return res.status(400).json({ error: "No file uploaded" });
// //       }

// //       // Read the uploaded file
// //       const filePath = req.file.path;
// //       const workbook = xlsx.readFile(filePath);
// //       const sheetName = workbook.SheetNames[0];
// //       const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// //       // Process and clean data
// //       const records = data.map((row) => {
// //         let dateValue = row["date"];

// //         // ✅ Handle Excel Date Serial Numbers
// //         if (typeof dateValue === "number") {
// //             // Convert serial date to JavaScript Date object
// //             let convertedDate = new Date((dateValue - 25569) * 86400 * 1000);
// //             dateValue = moment(convertedDate).format("YYYY-MM-DD");
// //         } else if (typeof dateValue === "string") {
// //             // ✅ Handle Text-Based Dates (MM/DD/YY or MM/DD/YYYY)
// //             let parsedDate = moment(dateValue, ["MM/DD/YY", "MM/DD/YYYY", "YYYY-MM-DD"], true);
// //             if (parsedDate.isValid()) {
// //                 dateValue = parsedDate.format("YYYY-MM-DD");
// //             } else {
// //                 console.warn(`Invalid date: ${dateValue} - Setting to NULL`);
// //                 dateValue = null;
// //             }
// //         } else {
// //             console.warn(`Invalid date: ${dateValue} - Setting to NULL`);
// //             dateValue = null;
// //         }
        
// //           return {
// //               org: row["org"] ? row["org"].toString().trim() : null,
// //               mohalla: row["mohalla"] ? row["mohalla"].toString().trim() : null,
// //               its: row["its"] ? row["its"].toString().trim() : null,
// //               sf: row["sf"] ? row["sf"].toString().trim() : null,
// //               student: row["student"] ? row["student"].toString().trim() : null,
// //               school: row["school"] ? row["school"].toString().trim() : null,
// //               date: dateValue, // Keep it as is if it's valid, otherwise NULL
// //               amount: row["amount"] ? parseFloat(row["amount"].toString().replace(/,/g, "")) : 0.00
// //           };
// //       });

// //       // Insert records into the database
// //       await AmbtRecord.bulkCreate(records);

// //       // Delete the uploaded file after processing
// //       fs.unlinkSync(filePath);

// //       res.status(200).json({ message: "File uploaded and records inserted successfully!" });
// //   } catch (error) {
// //       console.error("Error processing file:", error);
// //       res.status(500).json({ error: "Error uploading file" });
// //   }
// // });

// // /**
// //  * ✅ API: Upload Excel & Update STSMF Records
// //  */
// // router.post("/upload-stsmf", upload.single("file"), async (req, res) => {
// //   try {
// //       if (!req.file) {
// //           return res.status(400).json({ error: "No file uploaded" });
// //       }

// //       const filePath = req.file.path;
// //       const workbook = xlsx.readFile(filePath);
// //       const firstSheetName = workbook.SheetNames[0]; // Read first sheet
// //       const worksheet = workbook.Sheets[firstSheetName];
// //       const data = xlsx.utils.sheet_to_json(worksheet);

// //       const records = data.map((row) => ({
// //           org: row["org"] ? row["org"].toString().trim() : null,
// //           mohalla: row["mohalla"] ? row["mohalla"].toString().trim() : null,
// //           its: row["its"] ? row["its"].toString().trim() : null,
// //           sf: row["sf"] ? row["sf"].toString().trim() : null,
// //           amount: row["Amount"] ? parseFloat(row["Amount"].toString().replace(/,/g, "")) : 0.00
// //         }));

// //       await StsmfRecord.bulkCreate(records);
// //       fs.unlinkSync(filePath); // Remove file after processing

// //       res.status(200).json({ message: "STSMF records uploaded successfully!" });
// //   } catch (error) {
// //       console.error("Error processing file:", error);
// //       res.status(500).json({ error: "Error uploading file" });
// //   }
// // });

// // module.exports = router;