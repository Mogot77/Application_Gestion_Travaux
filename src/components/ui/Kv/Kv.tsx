import type { KvProps } from './types'

const Kv = ({ pairs }: KvProps) => (
  <dl className="kv">
    {pairs.map(([k, v]) => <div key={k} className="contents"><dt>{k}</dt><dd>{v}</dd></div>)}
  </dl>
)

export default Kv
