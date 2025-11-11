const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const DB_PATH = process.env.DB_PATH || './database/ctf.db';
const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });

const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

module.exports = { db, run, get, all };
