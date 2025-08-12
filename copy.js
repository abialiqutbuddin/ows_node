// insert_roles_umoor_missing.js
// Creates roles for users whose `umoor` is NOT defined,
// have a valid `UsrMohalla` (not empty, not "ALL"), and no existing RID=10 CompID=4 role.

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
    console.log('\nInserting roles for users with empty `umoor`, valid `UsrMohalla` ...');

    const sql = `
      INSERT INTO owsadmUsrRole
        (SysTag, UsrID, RID, CompID, URCrBy, URCrOn, UREditBy, UREditOn, mohallah_name)
      SELECT
        NULL AS SysTag,
        p.Id AS UsrID,
        10  AS RID,
        4   AS CompID,
        'Admin' AS URCrBy,
        NOW()   AS URCrOn,
        'Admin' AS UREditBy,
        NOW()   AS UREditOn,
        TRIM(p.UsrMohalla) AS mohallah_name
      FROM owsadmUsrProfil p
      JOIN users u
        ON p.UsrITS = LPAD(REGEXP_REPLACE(u.its_id, '[^0-9]', ''), 8, '0')
      WHERE
        (u.umoor IS NULL OR TRIM(u.umoor) = '')
        AND p.UsrMohalla IS NOT NULL
        AND TRIM(p.UsrMohalla) <> ''
        AND UPPER(TRIM(p.UsrMohalla)) <> 'ALL'
        AND NOT EXISTS (
          SELECT 1 FROM owsadmUsrRole r
          WHERE r.UsrID = p.Id
            AND r.RID = 10
            AND IFNULL(r.CompID,0) = 4
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