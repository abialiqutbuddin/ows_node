const sequelize = require("./config/db.js");
const User = require("./models/user.model");
const OwsReqMas = require("./models/owsReqMas.model");
const OwsReqForm = require("./models/owsReqForm.model");
const OwsCodeFile = require("./models/owsCodeFile.model");
const OwsReqStatus = require("./models/owsReqStatus.model");
const Module = require("./models/module.model");
const Feature = require("./models/feature.model");
const Permission = require("./models/permission.model");
const FeatureEndpoint = require("./models/featureEndpoint.model");
const Forms = require("./models/forms.model");
const FormFieldValue = require("./models/formFieldValue.model");
const FormField = require("./models/formField.model");

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Auto-update database schema
    console.log("Database synchronized successfully!");
  } catch (error) {
    console.error("Error syncing database:", error);
  } finally {
    process.exit();
  }
})();