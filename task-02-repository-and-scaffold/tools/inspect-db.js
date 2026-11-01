'use strict';
// Local inspection only. Never exposed as an HTTP route.
const { openDatabase } = require('./database');
const db = openDatabase(true);
try { console.log(JSON.stringify(db.prepare('SELECT id, name, phone, business_type, created_at FROM enquiries ORDER BY id').all(), null, 2)); }
finally { db.close(); }
