const Database = require('better-sqlite3');
const fs = require('fs');

// Abrimos tu base de datos
const db = new Database('./pos-database.sqlite');

// Consultamos el sqlite_master para obtener los CREATE TABLE (ignorando las tablas internas de sqlite)
const tablas = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

// Unimos todos los CREATE TABLE en un solo texto
const esquema = tablas.map(t => t.sql + ';').join('\n\n');

// Lo guardamos en el archivo
fs.writeFileSync('esquema.sql', esquema);
console.log('¡Esquema exportado a esquema.sql!');

db.close();