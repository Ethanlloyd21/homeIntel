import {
  Building2,
  ChevronDown,
  CloudSun,
  Compass,
  Home,
  Layers3,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
import Brand from './Brand'

export default function Sidebar({
  active,
  setActive,
  open,
  close,
}: {
  active: string
  setActive: (s: string) => void
  open: boolean
  close: () => void
}) {
  const nav = [
    ['Overview', Compass],
    ['Housing', Home],
    ['People', Users],
    ['Employment', Building2],
    ['Risk', ShieldAlert],
    ['Environment', CloudSun],
  ] as const
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-top">
        <Brand />
        <button className="mobile-close" onClick={close}>
          <X size={20} />
        </button>
      </div>
      <nav>
        {nav.map(([label, Icon]) => (
          <button
            key={label}
            className={active === label ? 'active' : ''}
            onClick={() => {
              setActive(label)
              close()
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Overview' && <i />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="source-card">
          <div>
            <Layers3 size={16} />
            <span>Verified sources</span>
          </div>
          <strong>4 connected</strong>
          <p>Census Â· FEMA Â· NOAA Â· USGS</p>
        </div>
        <button className="settings">
          <div className="avatar">LM</div>
          <span>
            <b>Lloyd M.</b>
            <small>Workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>
      </div>
    </aside>
  )
}
