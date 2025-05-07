const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

const dbConfig = {
  host: "36.50.12.171",
  port: "3309",
  user: "aak",
  password: "aak110",
  database: "owstest",
};

// Utility to remove null/undefined from JSON response
function removeNulls(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined));
}

app.get('/form-config', async (req, res) => {
  const db = await mysql.createConnection(dbConfig);

  try {
    const [sections] = await db.execute('SELECT * FROM form_sections ORDER BY display_order');
    const formConfig = [];

    for (const section of sections) {
      const sectionData = {
        title: section.title,
        key: section.key,
        type: section.type,
      };

      if (section.type === 'static') {
        formConfig.push(removeNulls(sectionData));
        continue;
      }

      const [subSections] = await db.execute(
        'SELECT * FROM form_subsections WHERE section_id = ? ORDER BY display_order',
        [section.id]
      );

      sectionData.subSections = [];

      for (const sub of subSections) {
        const subSectionData = {
          title: sub.title,
          key: sub.key,
          type: sub.type,
          radioLabel: sub.radio_label
        };

        const [fields] = await db.execute(
          'SELECT * FROM form_fields WHERE subsection_id = ? AND parent_field_id IS NULL ORDER BY display_order',
          [sub.id]
        );

        subSectionData.fields = [];

        for (const field of fields) {
          const fieldData = {
            type: field.type,
            label: field.label,
            key: field.key,
            validator: field.validator,
            enable: !!field.enable,
            hint: field.hint,
            itemsKey: field.items_key,
            dropdownLabel: field.dropdown_label,
            dropdownKey: field.dropdown_key,
            itemsKey2: field.items_key2,
            textFieldLabel: field.text_field_label,
            textFieldKey: field.text_field_key,
            conditional_value: field.conditional_value,
            on_condition: field.on_condition
          };

          if (field.condition_options) {
            try {
              fieldData.condition_options = JSON.parse(field.condition_options);
            } catch {
              fieldData.condition_options = [];
            }
          }

          if (field.has_unit) {
            fieldData.hasUnit = true;
            fieldData.unitKey = field.unit_key;
            fieldData.unitOptions = JSON.parse(field.unit_options || '[]');
          }

          // Field options
          const [options] = await db.execute(
            'SELECT option_label FROM form_field_options WHERE field_id = ?',
            [field.id]
          );
          if (options.length > 0) {
            fieldData.options = options.map(opt => opt.option_label);
          }

          // Conditional logic from condition table
          const [conditions] = await db.execute(
            'SELECT * FROM form_field_conditions WHERE field_id = ?',
            [field.id]
          );

          for (const cond of conditions) {
            if (cond.condition_type === 'showTextFieldIf') {
              fieldData.showTextFieldIf = cond.condition_value;
              fieldData.textFieldLabel = cond.show_field_label;
              fieldData.textFieldKey = cond.show_field_key;
            }
            if (cond.condition_type === 'showDropdownIf') {
              fieldData.showDropdownIf = Number(cond.condition_value);
              fieldData.dropdownLabel = cond.show_field_label;
              fieldData.dropdownKey = cond.show_field_key;
              fieldData.itemsKey2 = cond.show_field_options;
            }
            if (cond.condition_type === 'on_condition') {
              fieldData.on_condition = cond.condition_value;
              fieldData.conditional_value = cond.show_field_label;
              try {
                fieldData.condition_options = JSON.parse(cond.show_field_options || '[]');
              } catch {
                fieldData.condition_options = [];
              }
            }
          }

          // Nested fields for repeatables
          if (field.type === 'repeatable') {
            const [nestedFields] = await db.execute(
              'SELECT * FROM form_fields WHERE parent_field_id = ? ORDER BY display_order',
              [field.id]
            );

            fieldData.fields = [];

            for (const nested of nestedFields) {
              const nestedField = {
                type: nested.type,
                label: nested.label,
                key: nested.key,
                validator: nested.validator,
                enable: !!nested.enable,
                hint: nested.hint,
                itemsKey: nested.items_key
              };

              if (nested.has_unit) {
                nestedField.hasUnit = true;
                nestedField.unitKey = nested.unit_key;
                nestedField.unitOptions = JSON.parse(nested.unit_options || '[]');
              }

              const [nestedOptions] = await db.execute(
                'SELECT option_label FROM form_field_options WHERE field_id = ?',
                [nested.id]
              );
              if (nestedOptions.length > 0) {
                nestedField.options = nestedOptions.map(opt => opt.option_label);
              }

              fieldData.fields.push(removeNulls(nestedField));
            }
          }

          subSectionData.fields.push(removeNulls(fieldData));
        }

        sectionData.subSections.push(removeNulls(subSectionData));
      }

      formConfig.push(removeNulls(sectionData));
    }

    await db.end();
    res.json(formConfig);

  } catch (err) {
    console.error("❌ Error generating form config:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(3009,"0.0.0.0", () => {
  console.log('🚀 Server running at http://localhost:3000');
});