# HomeIntel User Guide

This guide teaches you how to use HomeIntel to decide whether to move to a city.

It is written for the person making the decision, not for developers. If you want
to know how the application is built, which datasets it uses, or how to deploy it,
read the [README](README.md) instead.

---

## Contents

1. [What HomeIntel does](#what-homeintel-does)
2. [What HomeIntel will not do](#what-homeintel-will-not-do)
3. [Your first ten minutes](#your-first-ten-minutes)
4. [Finding your way around](#finding-your-way-around)
5. [Step 1 — Research a city](#step-1--research-a-city)
6. [Step 2 — Describe your household](#step-2--describe-your-household)
7. [Step 3 — Say where you live now](#step-3--say-where-you-live-now)
8. [Step 4 — Read the Decision Brief](#step-4--read-the-decision-brief)
9. [Step 5 — Preview a day there](#step-5--preview-a-day-there)
10. [Step 6 — Pin the actual neighbourhood](#step-6--pin-the-actual-neighbourhood)
11. [Step 7 — Compare two cities](#step-7--compare-two-cities)
12. [Step 8 — Plan the move](#step-8--plan-the-move)
13. [Reading the numbers honestly](#reading-the-numbers-honestly)
14. [Keyboard shortcuts](#keyboard-shortcuts)
15. [Your privacy](#your-privacy)
16. [Common questions](#common-questions)

---

## What HomeIntel does

Most city-comparison tools tell you what a city _is_: median rent, population,
crime rate. HomeIntel tries to tell you what living there would be like **for
you**, and where you would be most likely to regret the move.

It does five things:

| Feature              | The question it answers                                              |
| -------------------- | -------------------------------------------------------------------- |
| **Life Simulator**   | What would my money actually look like each month if I lived there?  |
| **Regret Check**     | Where is this move most likely to go wrong for me specifically?      |
| **Day in Your Life** | What would an ordinary Tuesday — or a brutal August day — feel like? |
| **Decision Brief**   | Putting it all together, should I move, and what should I go check?  |
| **Move Plan**        | I have decided. What do I do, and in what order?                     |

Every number is calculated from public data — the Census Bureau, FEMA, Zillow,
the Bureau of Labor Statistics, Open-Meteo, and others — or from figures you
entered yourself. **No AI writes any number, score, or verdict in this
application.** Hover the small ⓘ icon next to any statement to see exactly where
it came from.

## What HomeIntel will not do

Being clear about this up front will save you disappointment:

- **It is not financial, tax, insurance, legal, or relocation advice.** It is a planning tool. Verify anything that matters with a qualified professional.
- **It does not know your tax situation.** You give it an effective tax rate as an assumption; it does not calculate a return, filing status, or deductions.
- **It cannot price a specific house or apartment.** It works with typical values for a city, not a listing.
- **It does not predict the future.** The regret check structures the trade-offs you should think about. It is not a prediction that you will or will not be happy.
- **It cannot tell you about culture, community, or whether you will make friends.** The "community" score is a limited demographic proxy, and the application says so.
- **US cities only for most data.** Census, FEMA, BLS, and school data do not exist for locations outside the United States. Weather and maps still work anywhere.

---

## Your first ten minutes

If you do nothing else, do this. It produces a genuinely useful answer.

1. **Set your move on the opening screen.** Fill in **where you live now** and **where you're thinking of moving**, then press the button. Setting both takes a few extra seconds and unlocks four of the ten regret factors straight away — do it now rather than later.
2. **Open _Life simulator_ in the left sidebar.** Fill in your real numbers: what you earn now, what you would earn there, how many people are in your household, whether you would rent or buy, and your recurring costs. This takes about three minutes and you only ever do it once.
3. **Open _Decision brief_.** If you set both cities on the opening screen, this is already complete. Read the verdict and the regret check, and expand any factor to see the evidence behind it.
4. **Scroll to "Questions to answer on the ground."** Those are the things HomeIntel cannot verify for you. Take them with you.

That is the core loop. Everything below adds precision to it.

---

## Finding your way around

### The sidebar

The left sidebar is split into two groups, because the application does two
different jobs.

**Research** — learning about the place:

| Page               | What it shows                                                         |
| ------------------ | --------------------------------------------------------------------- |
| **Overview**       | Map, current weather, population snapshot, key indicators, risk, jobs |
| **Housing**        | Home values and rents over time, ownership rates                      |
| **People**         | Demographics, education, schools, colleges                            |
| **Employment**     | Industries, employers, contractors, hospitals, wages                  |
| **Risk**           | FEMA natural-hazard breakdown by hazard type                          |
| **Environment**    | Weather through the year, commute and traffic planning                |
| **Neighbourhoods** | Pin a specific address and re-measure from it                         |

**Decide** — working out whether to move:

| Page                 | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| **Life simulator**   | Your monthly budget in that city                        |
| **Day in your life** | Five scenarios built from real recorded days            |
| **Decision brief**   | The verdict, the regret check, and a research-trip plan |
| **Move plan**        | Shortlist, move budget, and a 90-day checklist          |

### The "Your move" card

At the bottom of the sidebar, the **Your move** card always shows the route you
are considering:

```
YOUR MOVE                  ⟲ Reset
MOVING FROM
San Diego, California    ✎    ×
        ↓
MOVING TO
Austin, Texas            ✎    ×
```

- **Click either city name** to change it in place. A search box opens right there in the sidebar — pick a new city, or press `Esc` to cancel.
- **Click the ×** beside either one to clear just that leg. Clearing where you live now switches off the four comparison-based regret factors; clearing the destination returns you to the search.
- **Click Reset** to clear both at once and start a fresh comparison.

If **Moving from** says _Not set_, several comparisons are switched off — see
[Step 3](#step-3--say-where-you-live-now).

### Starting over

Click the **homeintel** wordmark at the top of the sidebar (or in the footer) at
any time. It clears where you are moving from, where you are moving to, and any
comparison city, and returns you to the landing search.

It does **not** throw away your work: your household profile, deal-breakers,
priority weights, shortlist, pinned addresses, and checklist progress are all
kept. You only have to pick cities again, not describe yourself again.

### The top tabs

**Explore**, **Decide**, and **Compare** jump to each area. The current city is
shown on the right, with a search box to change it.

### The command palette

Press **`Ctrl` + `K`** (**`⌘` + `K`** on a Mac) anywhere in the application.

Start typing and you can:

- Jump to any page — type "brief", "move", "day"
- Search for any city in the world — type its name and press `Enter`
- Switch between light and dark mode — type "light" or "dark"

Use the arrow keys to move, `Enter` to open, `Esc` to close. This is the fastest
way to work once you are familiar with the application.

### Light and dark mode

Use the sun/moon toggle in the top-right, or the command palette. Your choice is
remembered. On a first visit HomeIntel follows your operating system setting.

---

## Step 1 — Research a city

### Setting your move on the opening screen

The first screen asks for two cities:

| Field                               | What it is for                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **Where you live now**              | Optional, but it unlocks every comparison in the app. Set it if you possibly can. |
| **Where you're thinking of moving** | The city you want to research. Required.                                          |

Fill in either order — picking a destination does not whisk you away, so you can
go back and add your current city before continuing. Press **Research &lt;city&gt;**
when both are how you want them. The × beside a chosen city clears it.

If you only want to browse a city, leave the first field empty; you can set it
later from the Decision Brief or the **Your move** card in the sidebar.

You can also search for any city at any time with the command palette.

The **Overview** page gives you the shape of the place: where it is, what the
weather is doing right now, how many people live there, typical home values and
rents, its natural-hazard profile, and which industries employ people.

From there, work through the Research pages for anything that matters to you.
A few things worth knowing:

- **Housing** distinguishes Zillow's typical values (more current) from Census estimates (broader coverage). The page tells you which one you are looking at.
- **People** contains schools and colleges. These load when you open the section, not before, so give them a moment.
- **Employment** lists real named employers, federal contractors, and hospitals near the city — useful later when the regret check asks whether you could find a second job locally.
- **Risk** breaks the FEMA score into individual hazards. A city with a moderate overall score can still have a severe single hazard, which is the thing that actually affects your insurance.
- **Environment** has a commute planner where you can click two points on a map and get live traffic times.

You do not have to read all of it. The Decision Brief pulls the decision-relevant
parts together for you.

---

## Step 2 — Describe your household

Open **Life simulator**. This is where you tell HomeIntel about yourself, and it
is the single highest-value thing you can do in the application. You do it once;
every other page then uses it.

### The fields that matter most

| Field                        | What to enter                                                          |
| ---------------------------- | ---------------------------------------------------------------------- |
| **Annual household income**  | What you would earn _after_ the move, before tax                       |
| **Current annual income**    | What you earn _today_. Leave it equal if your pay would not change     |
| **Household size**           | Everyone whose groceries and utilities you pay for                     |
| **Housing plan**             | Rent or Buy. Buy reveals down-payment and mortgage-rate fields         |
| **Effective tax assumption** | Your best guess at total federal, state, local and payroll tax, as a % |
| **One-way commute**          | Distance from home to work, one direction                              |
| **Recurring costs**          | Healthcare, childcare, debt payments, and other essentials per month   |

Every field has a small **?** icon. Hover, tap, or tab to it for an explanation.

Results update as you type. Nothing needs saving.

### Reading the result

**Disposable income** shows gross income, minus all modelled costs, leaving what
remains. Click any cost row to see the formula or assumption behind it — this is
worth doing at least once so you know what the model is and is not counting.

**Total housing exposure** is the number most tools miss. It is not just rent: it
combines housing, utilities, transportation, and a hazard reserve, because a
cheap house in a high-tax, car-dependent, flood-prone area is not actually cheap.
Below about 30% of gross income is comfortable; above 45% is a strain.

### Setting your non-negotiables

Scroll to **Deal-breaker engine** and set your real limits: maximum housing cost,
minimum cash left over, maximum hazard risk, minimum employment rate, maximum
commute, how far a hospital may be, and how many comfortable-weather days a year
you need.

Each rule then shows a clear pass or fail with the actual value beside it.

Three rules — commute, hospital distance, and comfortable weather — only appear
once HomeIntel can actually measure them. That is deliberate: it will not check a
commute rule against a guess. Pin a workplace (Step 6) and the commute rule
appears.

### Priorities and a partner

**Household consensus** lets you and a partner set priority weights separately
across affordability, career, safety, and community. HomeIntel scores the city
through each person's priorities independently and reports both scores plus an
alignment percentage — so a compromise is visible instead of hidden inside one
averaged number.

---

## Step 3 — Say where you live now

If you set your current city on the opening screen, this is already done — the
sidebar's **Your move** card will show it under _Moving from_, and you can skip
ahead.

If not, open **Decision brief**. A panel at the top asks for it. Set it.

This matters more than it looks. Four of the ten regret factors describe a
_change_, not a state, and cannot be calculated without knowing where you are
moving from:

- **Housing-cost shock** — is housing more or less of a burden than it is today?
- **Salary adjustment** — does your pay buy more or less once regional price levels are accounted for?
- **Climate mismatch** — how many comfortable days a year do you gain or lose?
- **Distance from support network** — how far does this put you from the people you rely on?

Once set, the city appears under **Moving from** in the **Your move** card in the
sidebar and stays until you change it. You can swap it any time by clicking it
there, clear it with the × beside it, or reset both cities at once.

---

## Step 4 — Read the Decision Brief

This is the centrepiece. Read it top to bottom.

### The verdict

One of four outcomes, with the reasoning stated:

| Verdict                           | Meaning                                                |
| --------------------------------- | ------------------------------------------------------ |
| **Strong fit**                    | Clears every rule you set, with little regret pressure |
| **Workable with trade-offs**      | Viable, but price the trade-offs in deliberately       |
| **Proceed with caution**          | Only viable if you resolve specific risks first        |
| **Poor fit at these assumptions** | Does not fit the household and rules you described     |

Beside it: **City fit** (how well the city matches your weighted priorities) and
**Regret risk** (how much pressure there is toward regretting the move). Lower
regret is better.

Also shown: your **monthly cash difference** against your current city, the
**data confidence** level, and how many regret factors could be assessed.

### What fits, and what would have to be solved

Two columns, stated plainly. Every line carries a ⓘ icon — hover it to see the
source.

### The regret check

Nine factors, sorted with the highest risk first. Each shows a coloured bar and a
level of **Low**, **Moderate**, **Elevated**, or **High**. Click any factor to
expand its evidence.

| Factor                        | What it is telling you                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| Housing-cost shock            | Whether housing eats more of your income than it does today       |
| Monthly cash buffer           | Whether you have breathing room after everything is paid          |
| Salary adjustment             | Whether your pay goes further or less far in real terms           |
| Hazard & insurance exposure   | Natural-hazard risk, and the insurance cost it implies            |
| Job-market concentration      | Whether you could find another job locally if the first one ended |
| Commute shock                 | Whether the daily drive would wear you down                       |
| Climate mismatch              | Whether the weather suits you for enough of the year              |
| Healthcare access             | How far you would be from a major hospital                        |
| Distance from support network | How hard it becomes to see the people you rely on                 |
| Reported crime                | How the state's violent-crime rate compares to the US average     |

**Pay attention to the unassessed panel.** If HomeIntel could not measure a
factor, it says so and explains what is missing rather than scoring it as zero
risk. A low regret score with four factors unassessed is a much weaker statement
than a low score with all nine. The header always tells you the count.

### Questions to answer on the ground

Specific things HomeIntel cannot verify — insurance quotes, actual tax bills,
school waitlists, what the commute is really like at 5:30 PM. Take this list with
you.

### The test-drive itinerary

A three-day research trip, deliberately scheduled for the city's **hardest**
season. If the city is brutally hot in August, it tells you to visit in August,
and says why.

Each stop has a purpose and a check you can answer yes or no to on the spot, and
is tagged with the concern it resolves. It adapts to you — buyers tour homes and
ask for tax and insurance quotes; renters ask what the quoted rent excludes;
households with children visit the assigned school.

### Saving and printing

**Add to shortlist** saves the city to your Move Plan. **Print brief** produces a
clean printable version with the navigation stripped out.

---

## Step 5 — Preview a day there

Open **Day in your life**.

### Set your comfortable temperature range first

Two sliders at the top: too cold below, too hot above. Set them honestly — this
is your comfort, not a standard.

This single setting drives the comfortable-day count, the climate-mismatch regret
factor, the comfortable-weather deal-breaker, and which season the test-drive
itinerary tells you to visit in. Move the sliders and watch everything recalculate.

### The climate summary

Days a year inside your range, days reaching 90 °F, nights below freezing, wet
days, and snow days — measured from three years of actual recorded daily weather.

### The five scenarios

Pick one from the row of tabs:

| Scenario                | What it shows                                |
| ----------------------- | -------------------------------------------- |
| **Office workday**      | A typical mild day with your office schedule |
| **Remote-work day**     | The same day without the commute             |
| **Family weekend**      | Errands, schools, and the pace of a Saturday |
| **Winter day**          | A median winter day, with real sunset times  |
| **Extreme-weather day** | The hottest day in the recorded archive      |

Each scenario is built from **a real recorded day**, and names the date. The
sunrise, sunset, daylight hours, and temperatures are what was actually measured
that day. Wake and departure times follow that day's real sunrise.

The panel on the right shows how the whole year is shaped, season by season.

If a scenario says your commute has not been measured, that is honest reporting,
not a bug. Move on to Step 6.

---

## Step 6 — Pin the actual neighbourhood

Open **Neighbourhoods**. This is where HomeIntel stops talking about "the city"
and starts talking about a specific block.

City averages hide the decision. Hazard risk, commute time, and hospital access
change street by street.

### Pinning your points

**Home point** — type a street address, neighbourhood, or landmark you could
realistically live in, and pick it from the list. **Use city centre** fills in the
city centre if you are not that far along yet.

**Workplace** — where you would commute to. This one matters: it sets the routed
commute used across the whole application.

### What changes

| Row                  | What you get                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Commute**          | A real routed drive time in current traffic, with the delay over free-flow                           |
| **Hazard risk**      | The FEMA score for the census tract containing _your_ block, and how it differs from the city centre |
| **Nearest hospital** | Distance to the closest major hospital                                                               |
| **Nearest school**   | Recalculated from your pinned point, not the city centre                                             |
| **Transit stops**    | Mapped stops along your corridor                                                                     |
| **Typical housing**  | Still city-level — and the card says so                                                              |

The hazard comparison is the reason to use this page. Two addresses ten minutes
apart can sit in tracts with meaningfully different risk scores, and that
difference shows up in your insurance premium.

Add a second city to compare two specific addresses side by side — North Park
against Plano, rather than San Diego against Dallas.

**Note:** HomeIntel deliberately does not pretend to know block-level house
prices. Housing figures stay city-level, and the page tells you so rather than
implying precision it does not have.

---

## Step 7 — Compare two cities

Open **Compare** in the top tabs for a side-by-side view of two cities across
housing, demographics, opportunity, and FEMA risk, with the better value marked
on each row.

The Life Simulator also accepts a second city, which scores both through your
priorities and your partner's and shows the stronger household compromise.

For a full comparison, the most reliable approach is to open the Decision Brief
for each city in turn. Because both use the same household profile, the verdicts
are directly comparable.

---

## Step 8 — Plan the move

Open **Move plan**.

### Shortlist

Cities you saved from a Decision Brief. Click one to jump back to its brief; use
the bin icon to remove it.

### Move budget

An estimate of what the move itself costs — movers, deposits or closing costs,
travel, one month of overlapping housing, and setup costs — scaled to your
household size and the distance involved.

**Every figure is editable.** These are starting numbers, not quotes. As real
quotes arrive, type them in. The total updates, and HomeIntel tells you how many
months of gross income the move represents.

### The 90-day timeline

Tasks in four phases:

| Phase                 | Focus                                                         |
| --------------------- | ------------------------------------------------------------- |
| **Before you commit** | Income in writing, insurance quotes, real tax position, visit |
| **First 30 days**     | Mortgage pre-approval or rental applications, movers, schools |
| **Days 30–60**        | Healthcare transfer, utilities, change of address             |
| **Days 60–90**        | Licence, registration, voter registration, tax withholding    |

The list adapts to your household — buyers get a pre-approval step, households
with children get school-zone and childcare-waitlist steps. Tick items off as you
go; progress is saved per city.

The final task is _Re-run the simulator against real bills_. Do it. Replacing
every estimate with your first three actual statements tells you whether the plan
held.

---

## Reading the numbers honestly

HomeIntel is built to be candid about its own limits. Learning to read these
signals is what separates a useful answer from a falsely confident one.

### Confidence labels

Confidence describes **the quality of the source**, not whether the city scored
well. A "High" confidence label on a bad number still means the number is bad.

| Label           | Meaning                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| **High**        | A recent authoritative value at a relevant city or tract level                 |
| **Medium**      | Useful but less precise — broader geography, older data, or a fallback         |
| **Estimated**   | HomeIntel is applying a disclosed planning estimate; a real value is missing   |
| **Loading**     | Still fetching; the rating may change                                          |
| **Unavailable** | Nothing verified was returned. Confirm this independently before relying on it |

The Decision Brief's confidence table also shows the **geography** each value
describes. A value can be high confidence and still be measured across a whole
state — the state price level used for cost-of-living is exactly that, which is
why it reads Medium.

### Watch the coverage count

"Regret factors assessed: 8 of 10" is as important as the score beside it. Set an
origin city and pin a workplace and it becomes 10 of 10 — and the score becomes
much more meaningful.

### Where the numbers come from

Small ⓘ icons appear next to statements throughout the application. Hover, tap,
or keyboard-focus them for the source. Nothing in HomeIntel is unsourced.

### Things that are genuinely estimates

- **Cost of living** is a state-level price index. It cannot capture your neighbourhood.
- **Taxes** use the percentage _you_ entered. HomeIntel does not calculate tax.
- **Hazard reserve, move budget, and utility costs** are transparent planning formulas, not quotes.
- **The "community" score** uses education levels as a rough proxy. It says nothing about culture or belonging.
- **Regret weights and thresholds** are HomeIntel's editorial judgement about what tends to matter. They are a structured way to think, not a validated prediction.
- **Hospital and support-network distances** are straight-line, not driving distances.
- **Climate** describes a weather grid cell over three years. Three years is short, and a grid cell will not capture a valley or a coastline.

---

## Keyboard shortcuts

| Shortcut                 | Action                                          |
| ------------------------ | ----------------------------------------------- |
| `Ctrl` + `K` / `⌘` + `K` | Open the command palette                        |
| `↑` / `↓`                | Move through palette results                    |
| `Enter`                  | Open the highlighted result                     |
| `Esc`                    | Close the palette                               |
| `Tab`                    | Move between controls, including the ⓘ tooltips |

Everything in HomeIntel is reachable by keyboard. Tooltips open on focus as well
as on hover, so you do not need a mouse to see a source.

---

## Your privacy

Everything you enter — income, household details, deal-breakers, your shortlist,
your pinned addresses, your checklist progress — is stored **only in your own
browser**, using `localStorage`.

- There is no account and no sign-in.
- Nothing about your household is sent to any server run by HomeIntel.
- Nothing is sent to any AI service.
- No one else can see your profile.

The practical consequences: your data stays on **this browser on this device**.
It will not follow you to your phone, it will not survive clearing your browser
data, and anyone else using the same browser profile can see it.

HomeIntel does contact public data providers (the Census Bureau, Open-Meteo,
OpenStreetMap, and others) to fetch information about the cities you look up.
Those requests include the city or address you searched for, as any map or
weather site would.

---

## Common questions

**Do I have to fill in the Life Simulator before anything else works?**
The Research pages work immediately. The Decide pages all read from your
household profile, so they are far less useful until you have filled it in. It
takes about three minutes and you only do it once.

**Why do some regret factors say "not assessed"?**
Because HomeIntel could not measure them, and it would rather tell you than
guess. Four need an origin city; commute shock needs a pinned workplace; climate
needs the weather archive to finish loading; healthcare access needs a matched
hospital. The panel tells you which and why.

**Why does my commute say it has not been measured?**
You have not pinned a home point and workplace on the Neighbourhoods page. Until
then, HomeIntel will use the distance you typed into the Life Simulator as a
rough estimate, or say nothing — but it will not present a guess as a measurement.

**The comfortable-day count looks far too low.**
Check your temperature sliders on the Day in Your Life page. A narrow band — say
68–75 °F — will produce a small number in almost any city. That is correct
behaviour, not an error.

**Address search is not finding my street.**
Search needs at least three characters, and is deliberately limited to one
request per second, so it can lag slightly behind fast typing. Coverage comes
from OpenStreetMap and varies by area — try a nearby landmark or major
intersection instead of an exact house number.

**Some data says unavailable for my city.**
Most economic, hazard, and school data is US-only. Smaller places may be missing
from Census place-level datasets, or may not match a Zillow market area. The
confidence panel will tell you which category is missing.

**Can I compare more than two cities?**
Two at a time side by side. For more, save each to your shortlist from its
Decision Brief and open them in turn — the same household profile applies to all
of them, so the verdicts are comparable.

**How do I start over?**
Click the **homeintel** wordmark in the sidebar. That clears the cities you
selected and returns you to the landing search, while keeping your household
profile, shortlist, and progress. To clear just one leg, use the × beside it in
the **Your move** card.

To erase everything including your household profile, clear your browser's site
data for HomeIntel.

**Should I trust the verdict?**
Treat it as a structured second opinion, not an answer. It is only as good as the
assumptions you gave it and the data that was available — which is exactly why
the application shows you the confidence level, the coverage count, the evidence
behind every factor, and a list of questions it cannot answer for you. Go and
answer those questions.
