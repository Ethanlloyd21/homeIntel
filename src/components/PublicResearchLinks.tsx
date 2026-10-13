import { cityGuidePath, publicCities } from 'data/publicCities'

const PublicResearchLinks = () => (
  <section
    className="public-research-links"
    aria-labelledby="city-guides-title"
  >
    <p className="eyebrow">A PLACE TO START</p>
    <h2 id="city-guides-title">Research your next city</h2>
    <p>
      Start with a sourced housing snapshot, then explore the trade-offs for
      your household.
    </p>
    <nav aria-label="City research guides">
      {publicCities.map((city) => (
        <a key={city.slug} href={cityGuidePath(city)}>
          {city.name}, {city.stateCode}
        </a>
      ))}
    </nav>
    <div className="public-resource-nav">
      <a href="/cities/">All city guides</a>
      <a href="/about/">Data sources and methodology</a>
    </div>
  </section>
)

export default PublicResearchLinks
