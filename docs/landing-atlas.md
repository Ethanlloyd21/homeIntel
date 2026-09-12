# Landing atlas

The landing page previews U.S. relocation routes. Examples remain labeled as examples until the visitor selects **Make this my route**. The destination stays local to the picker until **Research** opens the workspace. Landing searches use Open-Meteo's `countryCode=US` filter; other search surfaces keep their existing behavior.

Housing previews read the existing `public/data/zillow-market.json` file and match city and state exactly. Dates appear alongside values. Percentage changes only appear for positive values with matching observation dates. Missing data remains unavailable, never zero or a fabricated estimate. The Daily life and The move panels describe research tools; they do not claim personalized results.

## Map asset

`src/data/usMapPaths.json` was derived from [U.S. Atlas 3 states-10m.json](https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json), which provides U.S. Census state boundaries. The 50 states and District of Columbia are included. The shared `projectUS` function uses an Albers equal-area projection for the contiguous states and separate Alaska and Hawaii insets. City pins use that same projection. The glowing connection is an illustrative curve, not a road or travel-distance estimate.

The dataset's copyright and permission notice is included at `public/data/us-atlas-license.txt`. To regenerate the paths after changing the projection, run `node scripts/build-landing-map.mjs path/to/states-10m.json` with a local copy of that dataset.

Motion can be paused and respects reduced-motion preferences. The atlas supports the existing light/dark setting. Map geometry tests check all state paths against the viewport and verify that featured-city pins land in the expected state, including Alaska and Hawaii.
