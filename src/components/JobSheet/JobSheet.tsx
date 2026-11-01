import { useApp } from '@/hooks/useApp'
import Layout from '@/components/Layout'
import JobSheetView from './JobSheetView'
import { buildSheets } from './helpers'
import type { JobSheetProps } from './types'

const JobSheet = ({ ids }: JobSheetProps) => {
  const { S } = useApp()
  return (
    <Layout>
      <JobSheetView sheets={buildSheets(S, ids)} onPrint={() => window.print()} />
    </Layout>
  )
}

export default JobSheet
