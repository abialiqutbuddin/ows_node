const mysql = require('mysql2/promise');
const formConfig = require('./form_config.json'); // Save your Dart-style JSON as a JS file

const dbConfig = {
    host: "36.50.12.171",
    port: "3309",
    user: "aak",
    password: "aak110",  // Add your database password
    database: "owstest",
};

let sectionCounter = 1;

async function insertData() {
  const connection = await mysql.createConnection(dbConfig);
  await connection.beginTransaction();

  try {
    for (const section of formConfig) {
      const sectionSerial = sectionCounter.toString();
      const [sectionResult] = await connection.execute(
        `INSERT INTO sections (parent_id, serial, title, key_name) VALUES (?, ?, ?, ?)`,
        [null, sectionSerial, section.title, section.key]
      );
      const sectionId = sectionResult.insertId;

      if (section.subSections) {
        let subCounter = 1;
        for (const sub of section.subSections) {
          const subSerial = `${sectionSerial}.${subCounter}`;
          const [subResult] = await connection.execute(
            `INSERT INTO sections (parent_id, serial, title, key_name, type) VALUES (?, ?, ?, ?, ?)`,
            [sectionId, subSerial, sub.title, sub.key, sub.type || null]
          );
          const subId = subResult.insertId;

          if (sub.fields) {
            let qCounter = 1;
            for (const field of sub.fields) {
              const qSerial = `${subSerial}.${qCounter}`;
              const [qResult] = await connection.execute(
                `INSERT INTO questions 
                  (section_id, serial, label, key_name, type, validator, hint, 
                   has_unit_dropdown, unit_key, unit_options, show_if_value, 
                   child_key, child_label, is_repeatable_group)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  subId, qSerial, field.label, field.key, field.type, field.validator || null,
                  field.hint || null,
                  field.hasUnitDropdown || false,
                  field.unitKey || null,
                  field.unitOptions ? JSON.stringify(field.unitOptions) : null,
                  field.showTextFieldIf || field.showDropdownIf || null,
                  field.textFieldKey || field.dropdownKey || null,
                  field.textFieldLabel || field.dropdownLabel || null,
                  field.type === 'repeatable'
                ]
              );
              const questionId = qResult.insertId;

              // Insert radio or dropdown options
              if (Array.isArray(field.options)) {
                for (const opt of field.options) {
                  await connection.execute(
                    `INSERT INTO question_options (question_id, option_type, label, is_conditional) VALUES (?, ?, ?, ?)`,
                    [questionId, field.type, opt, false]
                  );
                }
              }

              // Insert dynamic option source keys
              if (field.itemsKey) {
                await connection.execute(
                  `INSERT INTO question_options (question_id, option_type, source_key) VALUES (?, ?, ?)`,
                  [questionId, field.type, field.itemsKey]
                );
              }
              if (field.itemsKey2) {
                await connection.execute(
                  `INSERT INTO question_options (question_id, option_type, source_key) VALUES (?, ?, ?)`,
                  [questionId, field.type, field.itemsKey2]
                );
              }

              // Handle nested fields in repeatable groups
              if (field.type === 'repeatable' && Array.isArray(field.fields)) {
                let subQCounter = 1;
                for (const nestedField of field.fields) {
                  const nestedSerial = `${qSerial}.${subQCounter}`;
                  const [nestedQResult] = await connection.execute(
                    `INSERT INTO questions 
                      (section_id, parent_question_id, serial, label, key_name, type, validator, hint, 
                       has_unit_dropdown, unit_key, unit_options)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      subId, questionId, nestedSerial, nestedField.label, nestedField.key, nestedField.type,
                      nestedField.validator || null, null,
                      nestedField.hasUnitDropdown || false,
                      nestedField.unitKey || null,
                      nestedField.unitOptions ? JSON.stringify(nestedField.unitOptions) : null
                    ]
                  );

                  const nestedQuestionId = nestedQResult.insertId;

                  // Insert nested options if any
                  if (Array.isArray(nestedField.options)) {
                    for (const opt of nestedField.options) {
                      await connection.execute(
                        `INSERT INTO question_options (question_id, option_type, label, is_conditional) VALUES (?, ?, ?, ?)`,
                        [nestedQuestionId, nestedField.type, opt, false]
                      );
                    }
                  }

                  if (nestedField.itemsKey) {
                    await connection.execute(
                      `INSERT INTO question_options (question_id, option_type, source_key) VALUES (?, ?, ?)`,
                      [nestedQuestionId, nestedField.type, nestedField.itemsKey]
                    );
                  }

                  if (nestedField.itemsKey2) {
                    await connection.execute(
                      `INSERT INTO question_options (question_id, option_type, source_key) VALUES (?, ?, ?)`,
                      [nestedQuestionId, nestedField.type, nestedField.itemsKey2]
                    );
                  }

                  subQCounter++;
                }
              }

              qCounter++;
            }
          }

          subCounter++;
        }
      }
      sectionCounter++;
    }

    await connection.commit();
    console.log('Form config successfully inserted into MySQL.');
  } catch (err) {
    await connection.rollback();
    console.error('Error inserting data:', err);
  } finally {
    await connection.end();
  }
}

insertData();