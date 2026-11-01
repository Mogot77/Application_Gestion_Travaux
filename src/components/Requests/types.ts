export type TabKey = 'toutes' | 'a_traiter' | 'a_qualifier' | 'a_planifier' | 'occupants' | 'a_reactualiser' | 'cloturees'

export type FilterKey = 'etab' | 'dept' | 'lot' | 'urgence' | 'circuit' | 'statut'

export type DemUi = { tab: TabKey; q: string; etab: string; dept: string; lot: string; urgence: string; circuit: string; statut: string; page: number; sel: string[] }
