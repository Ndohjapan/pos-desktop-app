import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), `pos-${import.meta.env.MODE}.db`)
const db = new Database(dbPath)

// Define the current schema in one place
const currentSchema = {
  Category: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT UNIQUE',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME'
  },
  Food: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    name: 'TEXT',
    price: 'REAL',
    quantity: 'REAL',
    inStock: 'BOOLEAN DEFAULT true',
    image: 'TEXT',
    isDeleted: 'BOOLEAN DEFAULT false',
    categoryId: 'INTEGER',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME',
    foreignKeys: ['FOREIGN KEY (categoryId) REFERENCES Category(id)']
  },
  Order: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    total: 'REAL',
    subTotal: 'REAL DEFAULT 0',
    backupStatus: 'BOOLEAN DEFAULT false',
    isDeleted: 'BOOLEAN DEFAULT false',
    specialOrder: 'BOOLEAN DEFAULT false',
    serviceFee: 'REAL DEFAULT 0',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME'
  },
  OrderPayment: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    orderId: 'INTEGER',
    paymentMethod: 'TEXT',
    amount: 'REAL',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    foreignKeys: ['FOREIGN KEY (orderId) REFERENCES "Order"(id)']
  },
  OrderGroup: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    orderId: 'INTEGER',
    total: 'REAL',
    foreignKeys: ['FOREIGN KEY (orderId) REFERENCES "Order"(id)']
  },
  OrderItem: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    foodName: 'TEXT',
    quantity: 'INTEGER',
    price: 'REAL',
    amount: 'REAL',
    foodId: 'INTEGER',
    groupId: 'INTEGER',
    foreignKeys: [
      'FOREIGN KEY (foodId) REFERENCES Food(id)',
      'FOREIGN KEY (groupId) REFERENCES OrderGroup(id)'
    ]
  },
  Admin: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    fullName: 'TEXT',
    phoneNumber: 'TEXT UNIQUE',
    password: 'TEXT',
    verified: 'BOOLEAN DEFAULT false',
    isSuperAdmin: 'BOOLEAN DEFAULT false',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    updatedAt: 'DATETIME'
  }
}

// Initialize database with automatic schema synchronization
export const initializeDatabase = () => {
  // Create schema_version table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Get current schema version from database
  let currentVersion = 0
  try {
    const versionRow = db.prepare('SELECT version FROM schema_version WHERE id = 1').get() as
      | { version: number }
      | undefined
    currentVersion = versionRow ? versionRow.version : 0
  } catch (error) {
    console.log('No schema version found, initializing...')
  }

  // Calculate new schema version (simple hash of schema definition)
  const newVersion = JSON.stringify(currentSchema).split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  // If versions match, no changes needed
  if (currentVersion === newVersion) {
    console.log('Database schema is up to date')
    return
  }

  console.log(`Schema change detected. Updating from version ${currentVersion} to ${newVersion}...`)

  // Synchronize each table with the current schema
  db.transaction(() => {
    for (const [tableName, tableSchema] of Object.entries(currentSchema)) {
      synchronizeTable(tableName, tableSchema)
    }

    // Update schema version
    if (currentVersion === 0) {
      db.prepare('INSERT INTO schema_version (id, version) VALUES (1, ?)').run(newVersion)
    } else {
      db.prepare('UPDATE schema_version SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(newVersion)
    }
  })()

  console.log('Database schema updated successfully')
}

// Function to synchronize a table with its schema definition
function synchronizeTable(tableName, schema) {
  const quotedTableName = tableName === 'Order' ? '"Order"' : tableName
  
  // Check if table exists
  const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName)
  
  if (!tableExists) {
    // Create table if it doesn't exist
    let createSql = `CREATE TABLE ${quotedTableName} (`
    
    const columns = Object.entries(schema)
      .filter(([key]) => key !== 'foreignKeys')
      .map(([columnName, definition]) => `${columnName} ${definition}`)
    
    createSql += columns.join(', ')
    
    // Add foreign keys if any
    if (schema.foreignKeys && schema.foreignKeys.length > 0) {
      createSql += ', ' + schema.foreignKeys.join(', ')
    }
    
    createSql += ')'
    
    db.exec(createSql)
    console.log(`Created table: ${tableName}`)
  } else {
    // Table exists, check for missing columns
    const tableInfo = db.prepare(`PRAGMA table_info(${quotedTableName})`).all() as { name: string }[]
    const existingColumns = new Set(tableInfo.map(col => col.name))
    
    // Find columns that need to be added
    const columnsToAdd = Object.entries(schema)
      .filter(([key]) => key !== 'foreignKeys')
      .filter(([columnName]) => !existingColumns.has(columnName))
    
    // Add missing columns
    for (const [columnName, definition] of columnsToAdd) {
      const alterSql = `ALTER TABLE ${quotedTableName} ADD COLUMN ${columnName} ${definition}`
      db.exec(alterSql)
      console.log(`Added column ${columnName} to table ${tableName}`)
    }
  }
}

export default db
