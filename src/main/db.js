import Database from 'better-sqlite3'
import { join } from 'node:path'
import { getDataFolder } from './utils'

let db

export function getDB() {
  if (!db) {
    const dbPath = join(getDataFolder(), 'app.db')
    db = new Database(dbPath)

    // Enable foreign keys
    db.pragma('foreign_keys = ON')

    // Upazilas table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS upazilas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `
    ).run()

    // Seed upazilas
    const seedUpazilas = [
      'Khagrachari Sadar',
      'Dighinala',
      'Mahalchari',
      'Panchari',
      'Matiranga',
      'Manikchari',
      'Laxmichari',
      'Ramgarh',
      'Guimara'
    ]

    const insertUpazila = db.prepare('INSERT OR IGNORE INTO upazilas (name) VALUES (?)')
    const insertManyUpazilas = db.transaction((names) => {
      for (const name of names) insertUpazila.run(name)
    })
    insertManyUpazilas(seedUpazilas)

    // Categories table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `
    ).run()

    // Seed categories
    const seedCategories = [
      'Food',
      'Clothing',
      'Education',
      'Medical',
      'Shelter',
      'Emergency Relief'
    ]

    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)')
    const insertManyCategories = db.transaction((names) => {
      for (const name of names) insertCategory.run(name)
    })
    insertManyCategories(seedCategories)

    db.prepare(
      `
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parentName TEXT NOT NULL,
      nid TEXT UNIQUE NOT NULL,
      contactNumber TEXT UNIQUE NOT NULL,
      upazilaId INTEGER NOT NULL,
      address TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')) NOT NULL,
      categoryId INTEGER NOT NULL,

      status TEXT CHECK(status IN ('pending', 'approved', 'disbursed')) 
         NOT NULL DEFAULT 'pending',

      applicationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
      approvalDate DATETIME, 
      disbursementDate DATETIME,
      paymentType TEXT CHECK(paymentType IN ('cash', 'check')),
      paymentAmount INTEGER,
      paymentReference TEXT,

      FOREIGN KEY (upazilaId) REFERENCES upazilas(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );
    `
    ).run()

    db.prepare(
      `
    CREATE TABLE IF NOT EXISTS master_password (
      id INTEGER PRIMARY KEY CHECK(id = 1), -- always 1 row
      passwordHash TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
      `
    ).run()
  }

  return db
}
