import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), `pos-${import.meta.env.MODE}.db`)
const db = new Database(dbPath)

// Initialize database
export const initializeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS Food (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      quantity REAL,
      inStock BOOLEAN DEFAULT true,
      image TEXT,
      isDeleted BOOLEAN DEFAULT false,
      categoryId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      FOREIGN KEY (categoryId) REFERENCES Category(id)
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL,
      backupStatus BOOLEAN DEFAULT false,
      isDeleted BOOLEAN DEFAULT false,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS OrderPayment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER,
      paymentMethod TEXT,
      amount REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES "Order"(id)
    );

    CREATE TABLE IF NOT EXISTS OrderGroup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER,
      total REAL,
      FOREIGN KEY (orderId) REFERENCES "Order"(id)
    );

    CREATE TABLE IF NOT EXISTS OrderItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      foodName TEXT,
      quantity INTEGER,
      price REAL,
      amount REAL,
      foodId INTEGER,
      groupId INTEGER,
      FOREIGN KEY (foodId) REFERENCES Food(id),
      FOREIGN KEY (groupId) REFERENCES OrderGroup(id)
    );

    CREATE TABLE IF NOT EXISTS Admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT,
      phoneNumber TEXT UNIQUE,
      password TEXT,
      verified BOOLEAN DEFAULT false,
      isSuperAdmin BOOLEAN DEFAULT false,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );

  `)
}

export default db
