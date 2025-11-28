const sqlite3 = require('sqlite3').verbose();

// Open a database connection. The file will be created if it doesn't exist.
const db = new sqlite3.Database('./waveforms.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create the table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS waveforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      imageData TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table', err.message);
      } else {
        console.log('Table "waveforms" is ready.');
      }
    });
  }
});

module.exports = db;
