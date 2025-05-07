// 📦 Node.js Utility to Parse Dart Form Config and Insert into MySQL
const fs = require('fs');
const mysql = require('mysql2/promise');

// Dart JSON input from file (assuming it's exported to JSON format)
const dartFormConfig = require('./form_config.json');

async function insertFormConfig(config) {
  const db = await mysql.createConnection({
    host: "36.50.12.171",
    port: "3309",
    user: "aak",
    password: "aak110",
    database: "owstest",
  });

  // Clean slate
  await db.execute('DELETE FROM form_field_conditions');
  await db.execute('DELETE FROM form_field_options');
  await db.execute('DELETE FROM form_fields');
  await db.execute('DELETE FROM form_subsections');
  await db.execute('DELETE FROM form_sections');

  let sectionId = 1;

  for (const [sectionIndex, section] of config.entries()) {
    await db.execute(
      'INSERT INTO form_sections (id, title, `key`, type, display_order, page_type) VALUES (?, ?, ?, ?, ?, ?)',
      [sectionId, section.title, section.key, section.subSections ? 'dynamic' : 'static', sectionIndex + 1, section.page_type || 'standard']
    );

    if (!section.subSections) {
      sectionId++;
      continue;
    }

    for (const [subIndex, sub] of section.subSections.entries()) {
      const [subResult] = await db.execute(
        'INSERT INTO form_subsections (section_id, title, `key`, type, display_order, radio_label) VALUES (?, ?, ?, ?, ?, ?)',
        [sectionId, sub.title, sub.key, sub.type || 'standard', subIndex + 1, sub.radioLabel ?? null]
      );
      const subsectionId = subResult.insertId;

      if (sub.fields) {
        for (const [fieldIndex, field] of sub.fields.entries()) {
            const [fieldResult] = await db.execute(
                `INSERT INTO form_fields (
                  subsection_id, \`key\`, label, type, validator, enable, display_order,
                  is_repeatable, has_unit, unit_key, unit_options, hint, items_key,
                  dropdown_label, dropdown_key, items_key2,
                  text_field_label, text_field_key,
                  conditional_value, on_condition, condition_options,
                  parent_field_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  subsectionId,
                  field.key,
                  field.label,
                  field.type,
                  field.validator ?? null,
                  field.enable !== false,
                  fieldIndex + 1,
                  field.type === 'repeatable',
                  field.hasUnit ?? false,
                  field.unitKey ?? null,
                  field.unitOptions ? JSON.stringify(field.unitOptions) : null,
                  field.hint ?? null,
                  field.itemsKey ?? null,
                  field.dropdownLabel ?? null,
                  field.dropdownKey ?? null,
                  field.itemsKey2 ?? null,
                  field.textFieldLabel ?? null,
                  field.textFieldKey ?? null,
                  field.conditional_value ?? null,
                  field.on_condition ?? null,
                  field.condition_options ? JSON.stringify(field.condition_options) : null,
                  null // parent_field_id
                ]
              );

          const fieldId = fieldResult.insertId;

          // Options
          if (field.options) {
            for (const opt of field.options) {
              await db.execute(
                'INSERT INTO form_field_options (field_id, option_label, option_value) VALUES (?, ?, ?)',
                [fieldId, opt, opt]
              );
            }
          }

          // Conditions
          if (field.showTextFieldIf != null) {
            await db.execute(
              `INSERT INTO form_field_conditions 
              (field_id, condition_type, condition_value, show_field_label, show_field_key, show_field_type) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                fieldId,
                'showTextFieldIf',
                field.showTextFieldIf.toString(),
                field.textFieldLabel ?? null,
                field.textFieldKey ?? null,
                'text'
              ]
            );
          }

          if (field.showDropdownIf != null) {
            await db.execute(
              `INSERT INTO form_field_conditions 
              (field_id, condition_type, condition_value, show_field_label, show_field_key, show_field_type, show_field_options) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                fieldId,
                'showDropdownIf',
                field.showDropdownIf.toString(),
                field.dropdownLabel ?? null,
                field.dropdownKey ?? null,
                'dropdown',
                field.itemsKey2 ?? null
              ]
            );
          }

          if (field.on_condition) {
            await db.execute(
              `INSERT INTO form_field_conditions 
              (field_id, condition_type, condition_value, show_field_label, show_field_key, show_field_type, show_field_options) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                fieldId,
                'on_condition',
                field.on_condition ?? null,
                field.conditional_value ?? null,
                null,
                'radio',
                field.condition_options ? JSON.stringify(field.condition_options) : null
              ]
            );
          }

          // Nested fields (repeatable inner fields)
          if (field.fields && Array.isArray(field.fields)) {
            for (const [nestedIndex, nested] of field.fields.entries()) {
              const [nestedFieldResult] = await db.execute(
                'INSERT INTO form_fields (subsection_id, `key`, label, type, validator, enable, display_order, has_unit, unit_key, unit_options, hint, items_key, parent_field_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  subsectionId,
                  nested.key,
                  nested.label,
                  nested.type,
                  nested.validator ?? null,
                  nested.enable !== false,
                  nestedIndex + 1,
                  nested.hasUnit ?? false,
                  nested.unitKey ?? null,
                  nested.unitOptions ? JSON.stringify(nested.unitOptions) : null,
                  nested.hint ?? null,
                  nested.itemsKey ?? null,
                  fieldId
                ]
              );

              const nestedFieldId = nestedFieldResult.insertId;

              if (nested.options) {
                for (const opt of nested.options) {
                  await db.execute(
                    'INSERT INTO form_field_options (field_id, option_label, option_value) VALUES (?, ?, ?)',
                    [nestedFieldId, opt, opt]
                  );
                }
              }
            }
          }
        }
      }
    }

    sectionId++;
  }

  console.log('✅ Form config inserted successfully');
  await db.end();
}

insertFormConfig(dartFormConfig);

