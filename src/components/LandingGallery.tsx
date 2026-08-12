import { BrainCircuit, MapPin, Sparkles } from 'lucide-react'
import { useRef, type PointerEvent } from 'react'
import homeAtDusk from '../assets/images/home-at-dusk.jpg'
import cozyLivingRoom from '../assets/images/cozy-living-room.jpg'
import sunnySuburbanHome from '../assets/images/sunny-suburban-home.jpg'
import cozyLivingRoomNight from '../assets/images/cozy-living-room-night.jpg'

export default function LandingGallery({ theme }: { theme: 'light' | 'dark' }) {
  const galleryRef = useRef<HTMLDivElement>(null)

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current
    if (!gallery || event.pointerType === 'touch') return
    const bounds = gallery.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    gallery.style.setProperty('--pointer-x', `${x * 100}%`)
    gallery.style.setProperty('--pointer-y', `${y * 100}%`)
    gallery.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`)
    gallery.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`)
    gallery.style.setProperty('--shift-x', `${(x - 0.5) * 16}px`)
    gallery.style.setProperty('--shift-y', `${(y - 0.5) * 16}px`)
  }

  const resetPointer = () => {
    const gallery = galleryRef.current
    if (!gallery) return
    gallery.style.removeProperty('--tilt-x')
    gallery.style.removeProperty('--tilt-y')
    gallery.style.removeProperty('--shift-x')
    gallery.style.removeProperty('--shift-y')
  }

  return (
    <div
      ref={galleryRef}
      className="landing-gallery"
      aria-label="AI-powered city intelligence preview"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="landing-gallery-glow" aria-hidden="true" />
      <figure className="landing-photo landing-photo-main">
        <img
          className="theme-image theme-image-light"
          src={sunnySuburbanHome}
          alt={
            theme === 'light'
              ? 'Welcoming suburban home surrounded by a sunny green garden'
              : ''
          }
          aria-hidden={theme !== 'light'}
        />
        <img
          className="theme-image theme-image-dark"
          src={homeAtDusk}
          alt={
            theme === 'dark'
              ? 'Warmly illuminated modern homes on a hillside at dusk'
              : ''
          }
          aria-hidden={theme !== 'dark'}
        />
        <div className="landing-scan" aria-hidden="true" />
        <figcaption>
          <span>
            <Sparkles size={14} /> Your moving decision
          </span>
          <strong>Compare the places on your shortlist</strong>
        </figcaption>
      </figure>
      <figure className="landing-photo landing-photo-secondary">
        <img
          className="theme-image theme-image-light"
          src={cozyLivingRoom}
          alt={
            theme === 'light'
              ? 'Comfortable modern living room filled with natural light'
              : ''
          }
          aria-hidden={theme !== 'light'}
        />
        <img
          className="theme-image theme-image-dark"
          src={cozyLivingRoomNight}
          alt={
            theme === 'dark'
              ? 'Cozy modern living room with warm evening lighting'
              : ''
          }
          aria-hidden={theme !== 'dark'}
        />
        <figcaption>Research what everyday life could look like</figcaption>
      </figure>
      <div className="landing-data-card landing-data-location">
        <MapPin size={16} />
        <span>
          <small>CITY RESEARCH</small>
          <strong>Housing, people &amp; jobs</strong>
        </span>
      </div>
      <div className="landing-data-card landing-data-ai">
        <BrainCircuit size={17} />
        <span>
          <small>COMPARE CITIES</small>
          <strong>Make a confident move</strong>
        </span>
      </div>
    </div>
  )
}
