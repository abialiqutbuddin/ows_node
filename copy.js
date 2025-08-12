// insert_roles_umoor_company_match.js
// For users with umoor (UsrDesig), match to owsadmComp.CompName -> CompID,
// then insert a role row with RID=4. mohallah_name is blank. Skips duplicates.

import mysql from 'mysql2/promise';

const DB_NAME = 'ows_db';
const DB_USER = 'ows_user';
const DB_PASS = '20250507.Osw*';
const DB_HOST = 'ls-71e245ea4a0374b94a685ec89d871c50a32f80c2.cotk02keuuc1.us-east-1.rds.amazonaws.com';
const DB_PORT = 3306;

(async () => {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  try {
    console.log('\nInserting roles for users with umoor (UsrDesig) ...');

    const sql = `
      INSERT INTO owsadmUsrRole
        (SysTag, UsrID, RID, CompID, URCrBy, URCrOn, UREditBy, UREditOn, mohallah_name)
      SELECT
        NULL AS SysTag,
        p.Id AS UsrID,
        4   AS RID,
        c.Comp AS CompID,
        'Admin' AS URCrBy,
        NOW()   AS URCrOn,
        'Admin' AS UREditBy,
        NOW()   AS UREditOn,
        '' AS mohallah_name
      FROM owsadmUsrProfil p
      JOIN owsadmComp c
        ON LOWER(TRIM(c.CompName)) = LOWER(TRIM(p.UsrDesig))
      WHERE
        p.UsrDesig IS NOT NULL
        AND TRIM(p.UsrDesig) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM owsadmUsrRole r
          WHERE r.UsrID = p.Id
            AND r.RID   = 4
            AND IFNULL(r.CompID, 0) = IFNULL(c.Comp, 0)
        );
    `;

    const [res] = await conn.execute(sql);
    console.log(`Inserted roles: ${res.affectedRows || 0}`);
    console.log('Done.');
  } catch (e) {
    console.error('Role insert failed:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();