const express = require("express");
const Feature = require("../models/feature.model");
const Module = require("../models/module.model"); // Import Module model for reference
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleWare"); // Middleware to protect routes

// ✅ Create a new Feature
router.post("/feature",authMiddleware, async (req, res) => {
    try {
        const { module_id, feature_name } = req.body;

        // Check if the module exists before assigning a feature
        const moduleExists = await Module.findByPk(module_id);
        if (!moduleExists) {
            return res.status(400).json({ error: "Module ID does not exist" });
        }

        const feature = await Feature.create({ module_id, feature_name });

        return res.status(201).json({
            message: "Feature created successfully",
            feature,
        });
    } catch (error) {
        console.error("Failed to create feature:", error);
        return res.status(500).json({ error: "Failed to create feature", details: error.message });
    }
});

// ✅ Get All Features
router.get("/features",authMiddleware, async (req, res) => {
    try {
        const features = await Feature.findAll({
            include: {
                model: Module, // Include module details
                attributes: ["module_name"],
            },
        });

        return res.status(200).json(features);
    } catch (error) {
        console.error("Failed to fetch features:", error);
        return res.status(500).json({ error: "Failed to fetch features", details: error.message });
    }
});

// ✅ Get Feature by ID
router.get("/feature/:id",authMiddleware, async (req, res) => {
    try {
        const feature = await Feature.findByPk(req.params.id, {
            include: {
                model: Module,
                attributes: ["module_name"],
            },
        });

        if (!feature) {
            return res.status(404).json({ error: "Feature not found" });
        }

        return res.status(200).json(feature);
    } catch (error) {
        console.error("Failed to fetch feature:", error);
        return res.status(500).json({ error: "Failed to fetch feature", details: error.message });
    }
});

// ✅ Update Feature
router.put("/feature/:id",authMiddleware, async (req, res) => {
    try {
        const feature = await Feature.findByPk(req.params.id);
        if (!feature) {
            return res.status(404).json({ error: "Feature not found" });
        }

        const { feature_name } = req.body;

        await feature.update({ feature_name });

        return res.status(200).json({ message: "Feature updated successfully", feature });
    } catch (error) {
        console.error("Failed to update feature:", error);
        return res.status(500).json({ error: "Failed to update feature", details: error.message });
    }
});

// ✅ Delete Feature
router.delete("/feature/:id",authMiddleware, async (req, res) => {
    try {
        const feature = await Feature.findByPk(req.params.id);
        if (!feature) {
            return res.status(404).json({ error: "Feature not found" });
        }

        await feature.destroy();
        return res.status(200).json({ message: "Feature deleted successfully" });
    } catch (error) {
        console.error("Failed to delete feature:", error);
        return res.status(500).json({ error: "Failed to delete feature", details: error.message });
    }
});

// ✅ Create a new Module
router.post("/module",authMiddleware, async (req, res) => {
    try {
        const { module_name } = req.body;

        // Check if the module already exists
        const existingModule = await Module.findOne({ where: { module_name } });
        if (existingModule) {
            return res.status(400).json({ error: "Module name already exists" });
        }

        const module = await Module.create({ module_name });

        return res.status(201).json({
            message: "Module created successfully",
            module,
        });
    } catch (error) {
        console.error("Failed to create module:", error);
        return res.status(500).json({ error: "Failed to create module", details: error.message });
    }
});

// ✅ Get All Modules
router.get("/modules",authMiddleware, async (req, res) => {
    try {
        const modules = await Module.findAll();
        return res.status(200).json(modules);
    } catch (error) {
        console.error("Failed to fetch modules:", error);
        return res.status(500).json({ error: "Failed to fetch modules", details: error.message });
    }
});

// ✅ Get Module by ID
router.get("/module/:id",authMiddleware, async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) {
            return res.status(404).json({ error: "Module not found" });
        }

        return res.status(200).json(module);
    } catch (error) {
        console.error("Failed to fetch module:", error);
        return res.status(500).json({ error: "Failed to fetch module", details: error.message });
    }
});

// ✅ Update Module
router.put("/module/:id",authMiddleware, async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) {
            return res.status(404).json({ error: "Module not found" });
        }

        const { module_name } = req.body;

        await module.update({ module_name });

        return res.status(200).json({ message: "Module updated successfully", module });
    } catch (error) {
        console.error("Failed to update module:", error);
        return res.status(500).json({ error: "Failed to update module", details: error.message });
    }
});

// ✅ Delete Module
router.delete("/module/:id",authMiddleware, async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) {
            return res.status(404).json({ error: "Module not found" });
        }

        await module.destroy();
        return res.status(200).json({ message: "Module deleted successfully" });
    } catch (error) {
        console.error("Failed to delete module:", error);
        return res.status(500).json({ error: "Failed to delete module", details: error.message });
    }
});

module.exports = router;