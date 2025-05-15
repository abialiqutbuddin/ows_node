const mysql = require('mysql2/promise');
const formConfig = require('./form_config.json'); // your JSON config

const pool = mysql.createPool({
  host: "ls-71e245ea4a0374b94a685ec89d871c50a32f80c2.cotk02keuuc1.us-east-1.rds.amazonaws.com",
  port: 3306,
  user: "ows_user",
  password: "20250507.Osw*",  // use env vars for production
  database: "ows_db",
});

async function insertFormConfig() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const [sectionOrder, section] of formConfig.entries()) {
      const [sectionResult] = await conn.execute(
        'INSERT INTO form_sections (title, section_key, sort_order) VALUES (?, ?, ?)',
        [section.title, section.key, sectionOrder]
      );
      const sectionId = sectionResult.insertId;

      const subSections = section.subSections || [{ title: section.title, key: section.key, fields: section.fields }];
      for (const [subOrder, sub] of subSections.entries()) {
        const [subResult] = await conn.execute(
          'INSERT INTO form_subsections (section_id, title, subsection_key, sort_order) VALUES (?, ?, ?, ?)',
          [sectionId, sub.title, sub.key, subOrder]
        );
        const subId = subResult.insertId;

        for (const [fieldOrder, field] of (sub.fields || []).entries()) {
          const [fieldResult] = await conn.execute(
            `INSERT INTO form_fields (
              subsection_id, field_key, label, type, validator, hint,
              enable, sort_order, parent_key, enable_child_on,
              has_unit_dropdown, unit_key, items_key
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              subId,
              field.key,
              field.label || null,
              field.type,
              field.validator || null,
              field.hint || null,
              field.enable !== false,
              fieldOrder,
              field.parent_key || null,
              field.enable_child_on || null,
              field.hasUnitDropdown || false,
              field.unitKey || null,
              field.itemsKey || null
            ]
          );
          const fieldId = fieldResult.insertId;

          // Insert radio/multiselect options
          if (Array.isArray(field.options)) {
            for (const [i, opt] of field.options.entries()) {
              await conn.execute(
                'INSERT INTO form_field_options (field_id, label, value, sort_order) VALUES (?, ?, ?, ?)',
                [fieldId, opt, opt, i]
              );
            }
          }

          // Insert repeatable group fields
          if (field.type === 'repeatable' && field.fields) {
            for (const [repOrder, rep] of field.fields.entries()) {
              await conn.execute(
                `INSERT INTO form_repeatable_fields (
                  parent_field_id, repeatable_field_key, label, type, validator,
                  hint, enable, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  fieldId,
                  rep.key,
                  rep.label || null,
                  rep.type,
                  rep.validator || null,
                  rep.hint || null,
                  rep.enable !== false,
                  repOrder
                ]
              );
            }
          }
        }
      }
    }

    await conn.commit();
    console.log("✅ Form config inserted successfully.");
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error inserting form config:", err);
  } finally {
    conn.release();
  }
}

insertFormConfig();