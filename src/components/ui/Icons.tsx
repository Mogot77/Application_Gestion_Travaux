import type { ReactNode } from 'react'

function Svg({ d, s = 16, c = 'currentColor', w = 2 }: { d: ReactNode; s?: number; c?: string; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
  )
}

export const IcChev = ({ c = '#5B6472' }: { c?: string }) => <Svg c={c} d={<path d="M6 9l6 6 6-6" />} />
export const IcSearch = ({ c = '#5B6472' }: { c?: string }) => <Svg c={c} d={<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>} />
export const IcCam = ({ c = 'currentColor', s = 20 }: { c?: string; s?: number }) => <Svg s={s} c={c} d={<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>} />
export const IcPhoto = ({ s = 22 }: { s?: number }) => <Svg s={s} c="#7A8494" w={1.8} d={<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>} />
export const IcBack = () => <Svg s={20} c="#111827" d={<path d="M15 18l-6-6 6-6" />} />
export const IcCheck = ({ c = '#15803D', s = 30 }: { c?: string; s?: number }) => <Svg s={s} c={c} w={2.6} d={<path d="M5 12l5 5 9-10" />} />
export const IcList = ({ c }: { c?: string }) => <Svg s={22} c={c} d={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />} />
export const IcHome = ({ c }: { c?: string }) => <Svg s={22} c={c} d={<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />} />
export const IcPlus = ({ c }: { c?: string }) => <Svg s={22} c={c} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>} />
export const IcUser = ({ c }: { c?: string }) => <Svg s={22} c={c} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>} />
export const IcPhone = ({ c = 'currentColor' }: { c?: string }) => <Svg s={15} c={c} d={<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>} />
export const IcNav = ({ c = '#1D4ED8' }: { c?: string }) => <Svg s={18} c={c} d={<path d="M3 11l18-8-8 18-2-8z" />} />
export const IcTel = ({ c = '#1D4ED8' }: { c?: string }) => <Svg s={18} c={c} d={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />} />
export const IcPlay = ({ c = '#fff' }: { c?: string }) => <Svg s={20} c={c} d={<path d="M7 4l13 8-13 8z" />} />
export const IcFlag = ({ c = '#fff' }: { c?: string }) => <Svg s={20} c={c} d={<path d="M5 21V4h11l-2 4 2 4H5" />} />
export const IcInfo = ({ c = '#1D4ED8' }: { c?: string }) => <Svg s={18} c={c} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></>} />
export const IcUpload = ({ c = '#1D4ED8' }: { c?: string }) => <Svg s={22} c={c} d={<path d="M12 16V4M7 9l5-5 5 5M4 20h16" />} />
