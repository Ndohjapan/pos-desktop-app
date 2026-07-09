import Database from 'better-sqlite3'
import { applyPendingRestore, getDbPath } from './paths'

// Apply a staged restore (if any) before the file is opened.
applyPendingRestore()

const dbPath = getDbPath()
const db = new Database(dbPath)

// WAL improves crash resilience and read/write concurrency; foreign_keys
// enforces referential integrity on writes.
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

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
  },
  // Server-side sessions: real bearer tokens replace the old "token = admin row
  // id" scheme that was trivially forgeable from any till on the LAN.
  Session: {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    token: 'TEXT UNIQUE',
    adminId: 'INTEGER',
    expiresAt: 'DATETIME',
    createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
    foreignKeys: ['FOREIGN KEY (adminId) REFERENCES Admin(id)']
  }
}

// Indexes that keep queries fast as order history grows.
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_order_createdAt ON "Order"(createdAt)',
  'CREATE INDEX IF NOT EXISTS idx_order_backupStatus ON "Order"(backupStatus)',
  'CREATE INDEX IF NOT EXISTS idx_order_isDeleted ON "Order"(isDeleted)',
  'CREATE INDEX IF NOT EXISTS idx_ordergroup_orderId ON OrderGroup(orderId)',
  'CREATE INDEX IF NOT EXISTS idx_orderitem_groupId ON OrderItem(groupId)',
  'CREATE INDEX IF NOT EXISTS idx_orderpayment_orderId ON OrderPayment(orderId)',
  'CREATE INDEX IF NOT EXISTS idx_food_categoryId ON Food(categoryId)',
  'CREATE INDEX IF NOT EXISTS idx_session_token ON Session(token)'
]

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
  const newVersion = JSON.stringify(currentSchema)
    .split('')
    .reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

  // Synchronize tables only when the schema definition changed.
  if (currentVersion !== newVersion) {
    console.log(
      `Schema change detected. Updating from version ${currentVersion} to ${newVersion}...`
    )

    db.transaction(() => {
      for (const [tableName, tableSchema] of Object.entries(currentSchema)) {
        synchronizeTable(tableName, tableSchema)
      }

      if (currentVersion === 0) {
        db.prepare('INSERT INTO schema_version (id, version) VALUES (1, ?)').run(newVersion)
      } else {
        db.prepare(
          'UPDATE schema_version SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
        ).run(newVersion)
      }
    })()

    console.log('Database schema updated successfully')
  } else {
    console.log('Database schema is up to date')
  }

  // Always ensure indexes exist (idempotent). Runs after tables are guaranteed
  // to exist, whether or not the schema changed this launch.
  for (const indexSql of indexes) {
    db.exec(indexSql)
  }
}

// Function to synchronize a table with its schema definition
function synchronizeTable(tableName: string, schema: Record<string, string | string[]>) {
  const quotedTableName = tableName === 'Order' ? '"Order"' : tableName

  // Check if table exists
  const tableExists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(tableName)

  if (!tableExists) {
    // Create table if it doesn't exist
    let createSql = `CREATE TABLE ${quotedTableName} (`

    const columns = Object.entries(schema)
      .filter(([key]) => key !== 'foreignKeys')
      .map(([columnName, definition]) => `${columnName} ${definition}`)

    createSql += columns.join(', ')

    // Add foreign keys if any
    const foreignKeys = schema.foreignKeys
    if (Array.isArray(foreignKeys) && foreignKeys.length > 0) {
      createSql += ', ' + foreignKeys.join(', ')
    }

    createSql += ')'

    db.exec(createSql)
    console.log(`Created table: ${tableName}`)
  } else {
    // Table exists, check for missing columns
    const tableInfo = db.prepare(`PRAGMA table_info(${quotedTableName})`).all() as {
      name: string
    }[]
    const existingColumns = new Set(tableInfo.map((col) => col.name))

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
