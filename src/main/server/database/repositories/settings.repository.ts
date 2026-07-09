import db from '../client'
import CustomError from '../../utils/customError'
import { getErrorMessage } from '../../utils/errors'
import { StoreSettings } from '../../types'

const DEFAULTS: StoreSettings = {
  branchId: 'main',
  branchName: 'Amala Oluyole',
  quickService: false,
  cashiersEnabled: false,
  kitchenPrintingEnabled: false,
  kitchenPrinterName: ''
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === '1' || value === 'true'
}

export class SettingsRepository {
  getAll(): StoreSettings {
    try {
      const rows = db.prepare(`SELECT key, value FROM Settings`).all() as {
        key: string
        value: string
      }[]
      const map = new Map(rows.map((r) => [r.key, r.value]))
      return {
        branchId: map.get('branchId') ?? DEFAULTS.branchId,
        branchName: map.get('branchName') ?? DEFAULTS.branchName,
        quickService: parseBool(map.get('quickService'), DEFAULTS.quickService),
        cashiersEnabled: parseBool(map.get('cashiersEnabled'), DEFAULTS.cashiersEnabled),
        kitchenPrintingEnabled: parseBool(
          map.get('kitchenPrintingEnabled'),
          DEFAULTS.kitchenPrintingEnabled
        ),
        kitchenPrinterName: map.get('kitchenPrinterName') ?? DEFAULTS.kitchenPrinterName
      }
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }

  update(partial: Partial<StoreSettings>): StoreSettings {
    try {
      const upsert = db.prepare(`
        INSERT INTO Settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')
      `)
      const write = (key: string, value: string): void => {
        upsert.run(key, value)
      }

      if (partial.branchId !== undefined) write('branchId', partial.branchId)
      if (partial.branchName !== undefined) write('branchName', partial.branchName)
      if (partial.quickService !== undefined)
        write('quickService', partial.quickService ? '1' : '0')
      if (partial.cashiersEnabled !== undefined)
        write('cashiersEnabled', partial.cashiersEnabled ? '1' : '0')
      if (partial.kitchenPrintingEnabled !== undefined)
        write('kitchenPrintingEnabled', partial.kitchenPrintingEnabled ? '1' : '0')
      if (partial.kitchenPrinterName !== undefined)
        write('kitchenPrinterName', partial.kitchenPrinterName)

      return this.getAll()
    } catch (error) {
      throw new CustomError(getErrorMessage(error), 500)
    }
  }
}

export const settingsRepository = new SettingsRepository()
