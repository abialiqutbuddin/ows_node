const sequelize = require('../config/db');

const {
  StudentApplication,
  HouseAssets,
  EducationExpenses,
  DependentsExpense,
  TravellingExpense,
  BusinessAssets,
  QhLiability,
  EnayatLiability
} = require('../models/app_form/student_application.model');

// Temporary Draft model (only for reading/deleting)
const DraftModel = require('../models/student_application_draft.model');

// Map base64 fields to Sequelize models
const relatedModels = {
  assets_base64: HouseAssets,
  education_expenses_base64: EducationExpenses,
  dependents_base64: DependentsExpense,
  travelling_expense_base64: TravellingExpense,
  business_assets_base64: BusinessAssets,
  qh_liability_base64: QhLiability,
  enayat_liability_base64: EnayatLiability
};

async function transferDraftToApplication(draftId) {
  const transaction = await sequelize.transaction();

  try {
    console.log(`[START] Transferring draft ID: ${draftId}`);

    // Step 1: Fetch the draft row using Sequelize
    const draft = await DraftModel.findByPk(draftId, { transaction });
    if (!draft) throw new Error('Draft not found');
    console.log(`[INFO] Draft loaded successfully.`);

    // Step 2: Extract valid fields for main application
    const draftData = draft.dataValues;
    const appModelFields = Object.keys(StudentApplication.getAttributes());
    const insertData = {};

    for (const field of appModelFields) {
      if (field === 'id') continue;
      const value = draftData[field];

      if (value !== null && value !== undefined) {
        insertData[field] = value;
      } else {
        console.warn(`[WARN] Field '${field}' is null or undefined, skipping`);
      }
    }

    console.log('[DEBUG] Fields to be inserted into student_application:', Object.keys(insertData));

    // Step 3: Insert main application record
    const app = await StudentApplication.create(insertData, { transaction });
    const applicationId = app.id;
    console.log(`[SUCCESS] student_application created with ID: ${applicationId}`);

    // Step 4: Handle related base64 JSON tables
    const insertDynamicJson = async (base64, model, appId, base64FieldName) => {
        if (!base64) {
          console.log(`[SKIP] ${base64FieldName} is empty`);
          return;
        }
      
        try {
          const decoded = Buffer.from(base64, 'base64').toString();
          let data = JSON.parse(decoded);
      
          if (
            base64FieldName === 'assets_base64' &&
            Array.isArray(data) &&
            typeof data[0] === 'string'
          ) {
            data = data.map(value => ({ asset_name: value }));
            console.log(`[INFO] Converted array of strings to asset objects for ${base64FieldName}`);
          }
      
          const allowedFields = Object.keys(model.getAttributes())
            .filter(f => f !== 'id' && f !== 'application_id');
      
          console.log(`[INFO] Decoded data for ${base64FieldName}:`, data);
      
          let insertedCount = 0;
      
          for (const [index, item] of data.entries()) {
            if (!item || typeof item !== 'object') {
              console.warn(`[WARN] Skipping null/invalid record at index ${index} in ${base64FieldName}`);
              continue;
            }
      
            const record = { application_id: appId };
            let hasValidFields = false;
      
            for (const key of allowedFields) {
              if (item.hasOwnProperty(key) && item[key] !== null && item[key] !== undefined) {
                record[key] = item[key];
                hasValidFields = true;
              } else {
                console.warn(`[WARN] Skipping field '${key}' in record ${index} — value is null or missing`);
              }
            }
      
            if (!hasValidFields) {
              console.warn(`[WARN] Skipping record ${index} in ${base64FieldName} — all fields empty or invalid`);
              continue;
            }
      
            console.log(`[DEBUG] Inserting into ${model.name}:`, record);
            await model.create(record, { transaction });
            insertedCount++;
          }
      
          console.log(`[SUCCESS] ${insertedCount} ${model.name} record(s) inserted from ${base64FieldName}`);
        } catch (err) {
          console.error(`[ERROR] Failed to decode or insert ${base64FieldName}: ${err.message}`);
          throw err;
        }
      };

    for (const [base64Field, model] of Object.entries(relatedModels)) {
      await insertDynamicJson(draftData[base64Field], model, applicationId, base64Field);
    }

    // Step 5: Delete draft entry
    await DraftModel.destroy({ where: { id: draftId }, transaction });
    console.log(`[CLEANUP] Draft deleted with ID: ${draftId}`);

    // Final commit
    await transaction.commit();
    console.log(`[COMPLETE] Draft transfer finished for ID: ${draftId}`);

    return { success: true, applicationId };

  } catch (err) {
    await transaction.rollback();
    console.error('[ROLLBACK] Error during transfer:', err.message);
    throw err;
  }
}

module.exports = transferDraftToApplication;