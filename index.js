// Requires: express, mysql2, fs
const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const app = express();

// Configure MySQL pool
const pool = mysql.createPool({
    host: "36.50.12.171",
    port: "3309",
    user: "aak",
    password: "aak110",  // Add your database password
    database: "owstest",
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
  const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE app_id = ?`, [appId]);
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

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
