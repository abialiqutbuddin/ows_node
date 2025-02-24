const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model"); 
const Permission = require("../models/permission.model");

// Read Excel File
const filePath = path.join(__dirname, "users.xlsx");
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Define Constants
const SALT_ROUNDS = 10;
const MODULE_ID = 2;
const FEATURE_VIEW = 6;
const FEATURE_EDIT = 7;

// Function to Convert ITS to String
function formatITS(its) {
  return its ? String(its).trim() : null; 
}

// Import Users from Excel
async function importUsers() {
  let added = 0, skipped = 0, failed = 0;

  for (const row of data) {
    try {
      let { Name, ITS, Mohalla, Organization, User_Rights } = row;
      
      ITS = formatITS(ITS); // Ensure ITS is a string

      // Validate Data
      if (!ITS || !Name) {
        console.log(`Skipping invalid user: ${JSON.stringify(row)}`);
        skipped++;
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { its_id: ITS } });
      if (existingUser) {
        console.log(`Skipping duplicate ITS ID: ${ITS}`);
        skipped++;
        continue;
      }

      // Hash Password
      const hashedPassword = await bcrypt.hash(ITS, SALT_ROUNDS);

      // Create User
      const newUser = await User.create({
        its_id: ITS,
        role: "mini-admin",
        name: Name,
        email: `${ITS}@example.com`, // Default email pattern
        password: hashedPassword,
        mohalla: Mohalla || "Unknown",
        umoor: Organization || null,
      });

      // Assign Permissions
      const permissions = [];
      if (User_Rights && User_Rights.includes("View")) {
        permissions.push({ its_id: ITS, module_id: MODULE_ID, feature_id: FEATURE_VIEW });
      }
      if (User_Rights && User_Rights.includes("Edit")) {
        permissions.push({ its_id: ITS, module_id: MODULE_ID, feature_id: FEATURE_EDIT });
      }

      if (permissions.length > 0) {
        await Permission.bulkCreate(permissions);
      }

      console.log(`✔ User added: ${Name} (ITS: ${ITS})`);
      added++;
    } catch (error) {
      console.error(`❌ Failed to add user (ITS: ${row.ITS}): ${error.message}`);
      failed++;
    }
  }

  console.log(`✅ Import Completed: ${added} added, ${skipped} skipped, ${failed} failed.`);
}

// Run Import
importUsers();