import { ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react'
import homeAtDusk from 'assets/images/home-at-dusk.jpg'
import cozyLivingRoom from 'assets/images/cozy-living-room.jpg'
import sunnySuburbanHome from 'assets/images/sunny-suburban-home.jpg'
import cozyLivingRoomNight from 'assets/images/cozy-living-room-night.jpg'

/**
 * An illustrative brief, not live data — it shows the shape of the answer the
 * app produces. The numbers are fixed on purpose and labelled as a sample so
 * the page never implies a reading it has not taken.
 */
const sampleFactors = [
  { label: 'Housing-cost shock', risk: 64, level: 'caution' },
  { label: 'Salary adjustment', risk: 28, level: 'good' },
  { label: 'Climate mismatch', risk: 47, level: 'neutral' },
  { label: 'Commute shock', risk: 38, level: 'good' },
  { label: 'Reported crime', risk: 55, level: 'caution' },
  { label: 'Distance from family', risk: 78, level: 'alert' },
]

const LandingGallery = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div className="landing-dossier">
    <div className="landing-dossier-glow" aria-hidden="true" />

    <figure className="landing-plate landing-plate-main">
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
      <figcaption>
        <span>Sample brief</span>
        <strong>Mansfield, TX &rarr; Chula Vista, CA</strong>
      </figcaption>
    </figure>

    <div className="landing-verdict">
      <div className="landing-verdict-head">
        <span className="landing-verdict-score">
          72<small>/100</small>
        </span>
        <span>
          <small>VERDICT</small>
          <strong>Workable, with caution</strong>
        </span>
      </div>
      <ul className="landing-verdict-factors">
        {sampleFactors.map((factor) => (
          <li key={factor.label} className={`is-${factor.level}`}>
            <span>{factor.label}</span>
            <i aria-hidden="true">
              <b style={{ width: `${factor.risk}%` }} />
            </i>
          </li>
        ))}
      </ul>
      <p>
        <ShieldCheck size={13} aria-hidden="true" />
        Ten factors, each traced to a named public source
      </p>
    </div>

    <div className="landing-dossier-side">
      <div className="landing-stat landing-stat-cost">
        <small>MONTHLY CASH</small>
        <strong>
          <ArrowDownRight size={15} aria-hidden="true" />
          &minus;$412
        </strong>
        <span>vs. today, same standard of living</span>
      </div>

      <div className="landing-stat landing-stat-pay">
        <small>SALARY TO MATCH</small>
        <strong>
          <ArrowUpRight size={15} aria-hidden="true" />
          $104,800
        </strong>
        <span>to hold your buying power</span>
      </div>

      <figure className="landing-plate landing-plate-inset">
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
      </figure>
    </div>
  </div>
)

export default LandingGallery
