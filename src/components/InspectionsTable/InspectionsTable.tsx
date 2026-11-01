import { useApp } from '@/hooks/useApp'
import { getLog } from '@/helpers/domain'
import InspectionsTableView from './InspectionsTableView'
import { isAlert } from './helpers'
import type { InspectionsTableProps } from './types'

const InspectionsTable = ({ list, withLog }: InspectionsTableProps) => {
  const { S, mutate, toast, openModal } = useApp()
  const sansSuite = (id: string) => {
    mutate(s => { const c = s.constats.find(x => x.id === id); if (c) c.suite = 'aucune' }, { now: true })
    toast('Constat classé sans suite')
  }
  return (
    <InspectionsTableView
      withLog={withLog}
      rows={list.map(c => ({ c, logement: getLog(S, c.logementId), alert: isAlert(c) }))}
      onOpenPhoto={src => openModal({ title: 'Photo', wide: true, noFooter: true, body: <img src={src} alt="Photo" className="w-full rounded-lg" /> })}
      onNoFollowUp={sansSuite}
    />
  )
}

export default InspectionsTable
