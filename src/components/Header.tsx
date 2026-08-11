import { Bell, Download, Menu } from 'lucide-react'

export default function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header>
      <button className="menu" onClick={onMenu}>
        <Menu />
      </button>
      <div>
        <p className="eyebrow">LOCATION INTELLIGENCE</p>
        <h1>Good morning, Lloyd.</h1>
      </div>
      <div className="header-actions">
        <button className="icon-btn">
          <Bell size={18} />
          <i />
        </button>
        <button className="export">
          <Download size={16} /> Export report
        </button>
      </div>
    </header>
  )
}
