'use strict';
const path = require('node:path');
const Database = require('better-sqlite3');
const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH || 'data/enquiries.db');
function openDatabase(readonly = false) {
  return new Database(dbPath, { readonly, fileMustExist: true });
}
module.exports = { dbPath, openDatabase };
