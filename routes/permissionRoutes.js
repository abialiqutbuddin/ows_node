const express = require("express");
const Permission = require("../models/permission.model");
const Module = require("../models/module.model");
const Feature = require("../models/feature.model");
const FeatureEndpoint = require("../models/featureEndpoint.model");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleWare");

// ✅ Create a new Permission
router.post("/permission",authMiddleware, async (req, res) => {
    try {
        const { its_id, module_id, feature_id } = req.body;

        // Check if the module exists
        const moduleExists = await Module.findByPk(module_id);
        if (!moduleExists) {
            return res.status(400).json({ error: "Module ID does not exist" });
        }

        // Check if the feature exists
        const featureExists = await Feature.findByPk(feature_id);
        if (!featureExists) {
            return res.status(400).json({ error: "Feature ID does not exist" });
        }

        // Check if permission already exists for this ITS ID, module, and feature
        const existingPermission = await Permission.findOne({ where: { its_id, module_id, feature_id } });
        if (existingPermission) {
            return res.status(400).json({ error: "Permission already exists" });
        }

        // Create permission
        const permission = await Permission.create({ its_id, module_id, feature_id });

        return res.status(201).json({
            message: "Permission granted successfully",
            permission,
        });

    } catch (error) {
        console.error("Failed to create permission:", error);
        return res.status(500).json({ error: "Failed to create permission", details: error.message });
    }
});

// ✅ Get All Permissions
router.get("/permissions",authMiddleware, async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            include: [
                { model: Module, attributes: ["module_name"] },
                { model: Feature, attributes: ["feature_name"] },
            ],
        });

        return res.status(200).json(permissions);
    } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return res.status(500).json({ error: "Failed to fetch permissions", details: error.message });
    }
});

// ✅ Get Permissions by ITS ID
router.get("/permission/:itsId",authMiddleware, async (req, res) => {
    try {
        const itsId = req.params.itsId;

        const permissions = await Permission.findAll({
            where: { its_id: itsId },
            include: [
                { model: Module, attributes: ["module_name"] },
                { model: Feature, attributes: ["feature_name"] },
            ],
        });

        if (!permissions.length) {
            return res.status(404).json({ error: "No permissions found for this ITS ID" });
        }

        return res.status(200).json(permissions);
    } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return res.status(500).json({ error: "Failed to fetch permissions", details: error.message });
    }
});

// ✅ Update Permission
router.put("/permission/:itsId",authMiddleware, async (req, res) => {
    try {
        const { module_id, feature_id } = req.body;
        const itsId = req.params.itsId;

        const permission = await Permission.findOne({ where: { its_id: itsId, module_id, feature_id } });
        if (!permission) {
            return res.status(404).json({ error: "Permission not found" });
        }

        await permission.update({ module_id, feature_id });

        return res.status(200).json({ message: "Permission updated successfully", permission });
    } catch (error) {
        console.error("Failed to update permission:", error);
        return res.status(500).json({ error: "Failed to update permission", details: error.message });
    }
});

// ✅ Delete Permission
router.delete("/permission/:itsId/:moduleId/:featureId",authMiddleware, async (req, res) => {
    try {
        const { itsId, moduleId, featureId } = req.params;

        const permission = await Permission.findOne({ where: { its_id: itsId, module_id: moduleId, feature_id: featureId } });
        if (!permission) {
            return res.status(404).json({ error: "Permission not found" });
        }

        await permission.destroy();
        return res.status(200).json({ message: "Permission revoked successfully" });
    } catch (error) {
        console.error("Failed to delete permission:", error);
        return res.status(500).json({ error: "Failed to delete permission", details: error.message });
    }
});

// ✅ Create a new Feature Endpoint
router.post("/feature-endpoint",authMiddleware, async (req, res) => {
    try {
        const { feature_id, url_endpoint } = req.body;

        // Check if the feature exists before adding an endpoint
        const featureExists = await Feature.findByPk(feature_id);
        if (!featureExists) {
            return res.status(400).json({ error: "Feature ID does not exist" });
        }

        // Check if the endpoint already exists
        const existingEndpoint = await FeatureEndpoint.findOne({ where: { url_endpoint } });
        if (existingEndpoint) {
            return res.status(400).json({ error: "Endpoint URL already exists" });
        }

        const featureEndpoint = await FeatureEndpoint.create({ feature_id, url_endpoint });

        return res.status(201).json({
            message: "Feature Endpoint created successfully",
            featureEndpoint,
        });

    } catch (error) {
        console.error("Failed to create feature endpoint:", error);
        return res.status(500).json({ error: "Failed to create feature endpoint", details: error.message });
    }
});

// ✅ Get All Feature Endpoints
router.get("/feature-endpoints",authMiddleware, async (req, res) => {
    try {
        const featureEndpoints = await FeatureEndpoint.findAll({
            include: {
                model: Feature, // Include feature details
                attributes: ["feature_name"],
            },
        });

        return res.status(200).json(featureEndpoints);
    } catch (error) {
        console.error("Failed to fetch feature endpoints:", error);
        return res.status(500).json({ error: "Failed to fetch feature endpoints", details: error.message });
    }
});

// ✅ Get Feature Endpoint by ID
router.post("/feature-endpoint/get", authMiddleware, async (req, res) => {
    try {
        const { id } = req.body;

        // ✅ Validate input
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Invalid or missing 'id' in request body" });
        }

        // ✅ Fetch feature endpoint
        const featureEndpoint = await FeatureEndpoint.findByPk(id, {
            include: {
                model: Feature,
                attributes: ["feature_name"],
            },
        });

        if (!featureEndpoint) {
            return res.status(404).json({ error: "Feature Endpoint not found" });
        }

        return res.status(200).json(featureEndpoint);
    } catch (error) {
        console.error("Failed to fetch feature endpoint:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// ✅ Update Feature Endpoint
router.put("/feature-endpoint/update", authMiddleware, async (req, res) => {
    try {
        const { id, url_endpoint } = req.body;

        // ✅ Validate input
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Invalid or missing 'id' in request body" });
        }
        if (!url_endpoint || typeof url_endpoint !== "string" || url_endpoint.trim().length === 0) {
            return res.status(400).json({ error: "Invalid or missing 'url_endpoint' in request body" });
        }

        // ✅ Fetch feature endpoint
        const featureEndpoint = await FeatureEndpoint.findByPk(id);
        if (!featureEndpoint) {
            return res.status(404).json({ error: "Feature Endpoint not found" });
        }

        // ✅ Check if the new URL already exists (except for the current one)
        const existingEndpoint = await FeatureEndpoint.findOne({
            where: { url_endpoint, id: { [Op.ne]: id } } // Exclude the current endpoint from check
        });

        if (existingEndpoint) {
            return res.status(400).json({ error: "Endpoint URL already exists" });
        }

        // ✅ Update feature endpoint
        await featureEndpoint.update({ url_endpoint });

        return res.status(200).json({ message: "Feature Endpoint updated successfully", featureEndpoint });

    } catch (error) {
        console.error("Failed to update feature endpoint:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

// ✅ Delete Feature Endpoint
router.delete("/feature-endpoint/delete", authMiddleware, async (req, res) => {
    try {
        const { id } = req.body;

        // ✅ Validate input
        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "Invalid or missing 'id' in request body" });
        }

        // ✅ Fetch feature endpoint
        const featureEndpoint = await FeatureEndpoint.findByPk(id);
        if (!featureEndpoint) {
            return res.status(404).json({ error: "Feature Endpoint not found" });
        }

        // ✅ Delete feature endpoint
        await featureEndpoint.destroy();
        return res.status(200).json({ message: "Feature Endpoint deleted successfully" });

    } catch (error) {
        console.error("Failed to delete feature endpoint:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
});

module.exports = router;