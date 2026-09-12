# Environment and Risk data

## Daily weather and seasonal planning

`weatherOutlook.ts` fetches the previous ten complete calendar years plus current-year historical reanalysis from Open-Meteo. Daily forecast data takes precedence during the available 16-day forecast window. Later calendar dates receive a historical expectation from all baseline dates within ±7 calendar days, including December/January wrapping. A minimum of three historical years and 30 samples is required. Future weather codes are not invented.

High and low are separate historical averages, not confidence bounds. Wet-day frequency is the share of nonmissing precipitation records reaching 0.01 inch. Monthly humidity, freezing nights (minimum ≤32°F), hot days (maximum ≥90°F), snow days (snowfall >0), and gusty days (maximum gust ≥35 mph) use baseline observations. Monthly counts are average daily frequencies multiplied by calendar-month length. The displayed extreme dates are extremes within this reanalysis baseline, not official all-time station records.

Reanalysis combines models and observations; it is not a daily future forecast or the official 30-year climate normal. Future calendar cells are explicitly labeled historical expectations. The city's time zone determines today's date. Monthly road notes describe weather considerations and do not forecast closures or congestion.

Source: https://open-meteo.com/en/docs/historical-weather-api

## NOAA event history and damage

Run `npm run data:storms` to regenerate `public/data/storm-history/` from NOAA's five most recent completed calendar-year detail CSVs. The current snapshot is 2021–2025. The manifest records exact download URLs and generation time. Annual source revisions may change the reported values. Five years are a window into recorded events, not a complete hazard climatology.

Each event ID is counted once. County (`CZ_TYPE=C`) and weather-zone (`CZ_TYPE=Z`) records remain separate. The frontend matches the county using FEMA's state/county FIPS and obtains the current forecast zone from the NWS Points API. County totals can include locations outside city boundaries. The selected forecast zone may cover only part of a city and can differ from historical boundaries. Marine records are excluded. No data for a geography does not imply no hazards.

Property and crop damage preserve NOAA's K/M/B scale. Blank or unrecognized values remain missing; explicit zeros remain zero. Totals are nominal reported dollars, not inflation-adjusted, insured loss, FEMA annual loss, or a complete financial inventory. A storm may contain multiple event records. Seasonal concentrations count reports by incident month. Recent and costliest detail lists retain six records each, with links to the original event and excerpts of its narrative.

Sources:

- https://www.ncei.noaa.gov/stormevents/
- https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/
- https://www.weather.gov/documentation/services-web-api

## FEMA exposure and resilience

The geographic query matches the tract containing the selected point. The page displays FEMA's Expected Annual Loss score, annual loss dollars, community resilience, and social vulnerability. A score of 40/100 is a relative index, not a 40% disaster probability or loss fraction. Higher resilience indicates greater modeled recovery capacity; higher vulnerability indicates greater modeled vulnerability.

Total annual loss includes building, agricultural, and monetized population impacts. Building and agricultural components are shown separately. These modeled long-run values are distinct from NOAA's reported losses. Hazard bars show actual loss values on a linear scale or scores on a fixed 0–100 scale. Missing/sentinel values are not converted to zero. Drought has no building-loss fields in the current FEMA service and is queried accordingly.

Source: https://hazards.fema.gov/nri/data-resources

## Traffic access and verification

Live traffic uses TomTom raster flow tiles and Flow Segment Data. The historical map uses ArcGIS World Traffic exports, layer 7, with an entitled `ARCGIS_API_KEY`. Secrets remain server-side. Day, time, tile coordinates, and the selected city's time zone participate in historical requests and caching. Tests verify Monday 09:00 remains Monday 09:00 locally across DST changes and never reuses live tiles.

The available TomTom key successfully returned live traffic, but returned HTTP 403 when historical Traffic Stats access was checked. No ArcGIS traffic credential was configured. Therefore real citywide typical traffic cannot be verified or displayed until historical access is supplied. The interface reports this directly rather than showing an unlabeled blank map or live traffic under a historical time.

Sources:

- https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/v1/traffic-flow/raster-flow-tiles
- https://developers.arcgis.com/rest/routing/traffic-service/
