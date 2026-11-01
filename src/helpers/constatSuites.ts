/* Suites à donner à un constat, scénarios recommandés et préparation du courriel aux échelons (logique pure). */
import type { AppState, Constat, Logement } from '@/types'
import { ROLES, type Role } from '@/helpers/roles'
import { TODAY, diffDays } from '@/helpers/dates'

export type SuiteKey = 'intervention' | 'menages' | 'prevention' | 'fin_pec'

export type SuiteInfo = { key: SuiteKey; label: string; description: string }

export const SUITES: SuiteInfo[] = [
  { key: 'intervention', label: "Demande d'intervention technique", description: 'Un défaut du logement ou un équipement est à réparer : une demande est créée pour le service technique.' },
  { key: 'menages', label: 'Actions ménages', description: "Accompagnement de l'occupant sur l'entretien du logement : passage ménage, aide au tri ou au désencombrement, suivi par le travailleur social." },
  { key: 'prevention', label: 'Prévention', description: "Entretien de sensibilisation avec l'occupant (aération, sécurité, usage des équipements, règlement) et rappel écrit des règles." },
  { key: 'fin_pec', label: 'Fin de prise en charge', description: 'Situation grave ou persistante malgré les accompagnements : étude de la fin de prise en charge (instruction par le chef de service, décision de la direction).' },
]

/** Échelons pouvant être informés par courriel, du terrain vers la direction. */
export const ECHELONS: Role[] = ['travailleur_social', 'chef_service', 'directeur_etab', 'coordinateur', 'directeur']

export type DraftConstat = { proprete: number | null; bati: string; signalements: string[] }

export type Scenario = { id: string; titre: string; raison: string; suites: SuiteKey[]; echelons: Role[] }

const has = (sig: string[], re: RegExp) => sig.some(s => re.test(s))

/** Vrai si un constat récent du même logement était déjà noté ≤ 2 (récidive). */
export const recidive = (S: AppState, logementId: string): boolean =>
  S.constats.some(c => c.logementId === logementId && c.proprete <= 2 && diffDays(c.date, TODAY) <= 120)

/** Scénarios applicables au constat saisi, avec les suites et échelons conseillés. */
export const scenarios = (d: DraftConstat, rec: boolean): Scenario[] => {
  const out: Scenario[] = []
  const sig = d.signalements
  const p = d.proprete
  if (has(sig, /Chauffage d'appoint|électrique dangereuse|Détecteur de fumée/)) {
    out.push({ id: 'securite', titre: 'Risque pour la sécurité', raison: "Un danger immédiat est signalé : intervention urgente et information de l'encadrement.", suites: ['intervention', 'prevention'], echelons: ['coordinateur', 'directeur_etab', 'directeur'] })
  }
  if (has(sig, / HS$/)) {
    out.push({ id: 'equipement', titre: 'Équipement hors service', raison: 'Un équipement doit être réparé ou remplacé.', suites: ['intervention'], echelons: ['coordinateur'] })
  }
  if (has(sig, /Nuisibles/)) {
    out.push({ id: 'nuisibles', titre: 'Nuisibles', raison: "Traitement à programmer, puis remise en état avec l'occupant.", suites: ['intervention', 'menages'], echelons: ['coordinateur', 'chef_service'] })
  }
  if (has(sig, /Humidité|VMC|Aérations/)) {
    out.push({ id: 'humidite', titre: 'Humidité et aération', raison: "Vérifier la ventilation et sensibiliser l'occupant à l'aération.", suites: has(sig, /Humidité|VMC/) ? ['intervention', 'prevention'] : ['prevention'], echelons: ['travailleur_social', 'coordinateur'] })
  }
  if (has(sig, /Linge séchant/)) {
    out.push({ id: 'linge', titre: 'Séchage du linge dans le logement', raison: 'Rappel des bonnes pratiques de séchage et d’aération.', suites: ['prevention'], echelons: ['travailleur_social'] })
  }
  if (has(sig, /Encombrement|Odeurs/)) {
    out.push({ id: 'encombrement', titre: 'Encombrement ou odeurs', raison: 'Accompagnement au tri et à l’entretien du logement.', suites: ['menages', 'prevention'], echelons: ['travailleur_social', 'chef_service'] })
  }
  if (has(sig, /animaux/)) {
    out.push({ id: 'animaux', titre: "Présence d'animaux (interdite)", raison: 'Rappel du règlement et suivi par le chef de service.', suites: ['prevention'], echelons: ['travailleur_social', 'chef_service'] })
  }
  if (has(sig, /Dégradations/)) {
    out.push({ id: 'degradations', titre: 'Dégradations', raison: 'Remise en état et rappel des obligations de l’occupant.', suites: ['intervention', 'prevention'], echelons: ['chef_service', 'directeur_etab'] })
  }
  if (has(sig, /Drogues/)) {
    out.push({ id: 'drogues', titre: 'Drogues (interdit)', raison: 'Manquement grave au règlement : information de la direction et étude de la fin de prise en charge.', suites: ['prevention', 'fin_pec'], echelons: ['chef_service', 'directeur_etab', 'directeur'] })
  }
  if (p != null && p <= 2) {
    out.push({
      id: 'proprete', titre: `Propreté insuffisante (${p} / 6)`,
      raison: p <= 1 ? 'Logement insalubre : actions ménages immédiates et information de la direction d’établissement.' : 'Actions ménages et accompagnement par le travailleur social.',
      suites: p <= 1 ? ['menages', 'prevention'] : ['menages'],
      echelons: p <= 1 ? ['travailleur_social', 'chef_service', 'directeur_etab'] : ['travailleur_social', 'chef_service'],
    })
    if (rec) {
      out.push({ id: 'recidive', titre: 'Propreté insuffisante persistante', raison: 'Un constat récent était déjà ≤ 2 : si les actions n’ont pas suffi, étudier la fin de prise en charge.', suites: ['fin_pec'], echelons: ['directeur_etab', 'directeur'] })
    }
  }
  if (d.bati === 'Dégradé' && !out.some(s => s.suites.includes('intervention'))) {
    out.push({ id: 'bati', titre: 'Bâti dégradé', raison: 'Faire évaluer l’état du bâti par le service technique.', suites: ['intervention'], echelons: ['coordinateur', 'directeur_etab'] })
  }
  return out
}

/** Suites et échelons conseillés (union des scénarios). */
export const suggestions = (sc: Scenario[]): { suites: SuiteKey[]; echelons: Role[] } => ({
  suites: [...new Set(sc.flatMap(s => s.suites))],
  echelons: ECHELONS.filter(e => sc.some(s => s.echelons.includes(e))),
})

export type Destinataire = { email: string; role: Role; etab?: string }

/** Adresses des échelons choisis : les rôles d'établissement ne reçoivent que les constats de leur établissement. */
export const destinataires = (users: Destinataire[], echelons: Role[], log?: Logement): string[] =>
  [...new Set(users.filter(u => echelons.includes(u.role) && (!ROLES[u.role].needsEtab || !log || u.etab === log.etab)).map(u => u.email))]

/** Lien `mailto:` prérempli (le courriel part depuis la messagerie de l'utilisateur). */
export const mailto = (to: string[], c: Constat, log: Logement | undefined, S: AppState): string => {
  const lib = (k: string) => SUITES.find(s => s.key === k)?.label ?? k
  const subject = `[Constat ${c.id}] ${log ? `${log.id} · ${log.ville}` : 'Logement'} — propreté ${c.proprete}/6`
  const body = [
    'Bonjour,',
    '',
    `Un constat d'état a été enregistré le ${c.date} (${c.contexte}) par ${c.auteur}.`,
    '',
    `Logement : ${log ? `${log.id} — ${log.adresse}, ${log.cp} ${log.ville} (${log.etab})` : c.logementId}`,
    `Propreté : ${c.proprete}/6 (${S.ref.proprete[c.proprete] ?? ''})`,
    `État du bâti : ${c.bati}`,
    `Signalements : ${c.signalements.length ? c.signalements.join(', ') : 'aucun'}`,
    ...(c.commentaire ? [`Commentaire : ${c.commentaire}`] : []),
    `Suites envisagées : ${c.actions?.length ? c.actions.map(lib).join(', ') : 'à définir'}`,
    '',
    'Cordialement,',
    c.auteur,
  ].join('\n')
  return `mailto:${to.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
