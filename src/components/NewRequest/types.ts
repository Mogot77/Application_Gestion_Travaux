export type CheckItem = ['ok' | 'wa' | 'na', string]

export type CheckResult = { items: CheckItem[]; ok: boolean }
