import type { ExtProps } from './types'

const Ext = ({ name }: ExtProps) => {
  const e = name.split('.').pop() || ''
  return <span className={`ext ${e}`}>{e.toUpperCase()}</span>
}

export default Ext
