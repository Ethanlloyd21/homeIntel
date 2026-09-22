# Deploy ReloIntel with Amplify Gen 2

The repository includes the backend, Hosting build specification, SPA rewrite
configuration, and frontend API URL wiring. AWS resources have not been deployed
just by adding these files. The first deployment requires the console setup below.

## What gets deployed

- Amplify Hosting serves the React/Vite build in `dist`.
- API Gateway HTTP API exposes GET `/api/*` routes backed by one Amplify Function.
- The Lambda runs the same handlers used in local Vite development, including the
  Census proxy. No provider keys are required by the browser.
- A DynamoDB TTL table shares successful responses between Lambda instances.
  Responses larger than 350 KB bypass the shared cache. Existing in-memory caches
  still reduce repeated upstream calls on warm instances.
- Address searches use a DynamoDB lease to serialize Nominatim requests and cache
  results for seven days. Busy requests fail instead of exceeding the upstream rate.
- Household profiles and move plans still stay in browser local storage.

The API is public, read-only, and allows browser GET requests through CORS. The
default API Gateway throttle is 25 requests/second with a burst of 50. It is not
authentication or a hard spending limit. Review these values for your expected
traffic. API Gateway HTTP integrations have a roughly 30-second request limit;
slow upstream requests, particularly first-time school/economy loads, may time out.
Check the deployed routes against real upstream APIs before launching publicly.

## 1. Push the deployment files

Review and push the project changes, including `amplify/`, `amplify.yml`,
`package.json`, `package-lock.json`, the shared server modules, frontend changes,
and this guide. Keep the checked-in `public/data/` files; builds do not regenerate
large public datasets.

Never commit `.env`, `.aws/`, `.amplify/`, AWS profiles, access keys, session tokens,
or secret values. `.gitignore` excludes these. `amplify_outputs.json` is generated
per environment and excluded too; the build reads only its public API URL.

## 2. Connect the Git repository

1. Open AWS Amplify in the desired AWS account and region.
2. Create a new app, select your Git provider, and select the repository and branch.
3. Use the repository root, not `src`, as the app root.
4. Select Amazon Linux 2023 as the build image. `amplify.yml` installs Node.js 24.
5. Let Amplify create a backend deployment service role, or select an existing
   role permitted to deploy Amplify Gen 2/CDK resources. Use the Amplify service
   role workflow; do not supply AWS access keys as build variables.
6. Use the checked-in `amplify.yml`. It deploys the backend before building the
   frontend, runs tests and backend typechecking, and scans the built assets for
   configured secrets and AWS access key identifiers.

If the initial automatic build starts before secrets are configured, let it fail,
configure the secrets, and redeploy the branch.

## 3. Add secrets in AWS, not GitHub

In the Amplify app's **Secrets** settings, add these names with their real provider
values and make them available to the deployment branch:

| Secret             | Required? | Purpose                                           |
| ------------------ | --------- | ------------------------------------------------- |
| `CENSUS_API_KEY`   | Yes       | Census housing, demographics, employment, and QWI |
| `DATA_GOV_API_KEY` | Yes       | FBI, College Scorecard, and default EIA key       |
| `TOMTOM_API_KEY`   | Optional  | Live traffic and routing                          |
| `ARCGIS_API_KEY`   | Optional  | Historical traffic tiles                          |
| `BEA_API_KEY`      | Optional  | County GDP                                        |
| `EIA_API_KEY`      | Optional  | Dedicated EIA credential instead of Data.gov      |

Optional secrets are referenced only when the corresponding **Hosting environment
variable** is exactly `true`:

| Non-secret build variable | Secret enabled   |
| ------------------------- | ---------------- |
| `ENABLE_TOMTOM=true`      | `TOMTOM_API_KEY` |
| `ENABLE_ARCGIS=true`      | `ARCGIS_API_KEY` |
| `ENABLE_BEA=true`         | `BEA_API_KEY`    |
| `ENABLE_EIA=true`         | `EIA_API_KEY`    |

Leave those flags unset for unavailable services; existing unavailable/baseline
behavior remains. Add the matching secret before enabling a flag, then redeploy.
`VITE_KOFI_URL` is an optional public build variable.

Do not configure `VITE_CENSUS_API_KEY` in Hosting. Census now uses a server secret.
Do not place any secret in a `VITE_` variable or in `amplify_outputs.json`.

## 4. Deploy and configure frontend routing

Redeploy the branch after configuring secrets. The backend writes its API URL to
`amplify_outputs.json`; Vite uses it automatically. No manual API URL or API reverse
proxy rewrite is needed. Local development uses same-origin `/api/*` by default.

In **Hosting → Rewrites and redirects**, import the rules from
[`amplify/hosting-rewrites.json`](../amplify/hosting-rewrites.json). This is a console
configuration file: Amplify does not automatically apply it from the repository.
It serves `index.html` for frontend routes while preserving assets and JSON files.

For a custom domain, use **Hosting → Custom domains**, add the domain and desired
branch, and complete Amplify's DNS verification steps. No domain is hard-coded.

## 5. Verify the live deployment

- Open the generated `amplifyapp.com` URL and search for a U.S. city.
- Check housing, demographics, schools, employers, and current economic data.
- Refresh `/decision-brief` and `/neighborhoods` directly.
- Test home/work address searches and optional live/historical traffic layers.
- Check that traffic tiles are PNG images and API requests return JSON.
- Inspect browser requests: no Census/provider keys should appear in URLs or JS.
- Check Lambda logs for execution failures and API Gateway for throttling/timeouts.
- The profile on the new domain starts fresh: local storage belongs to each origin.

## Local development and checks

The Gen 2 project and CLI dependencies are already set up. Do not run
`npm create amplify@latest` over this configured backend. To enter IAM credentials
yourself, open PowerShell in the project folder and run:

```powershell
npx.cmd ampx configure profile --name relointel
```

Follow the prompts for your access key ID, secret access key, and AWS region.
The `relointel` profile is stored under your Windows user directory's `.aws` folder, outside
this repository. If your profile already exists, use `aws configure --profile
PROFILE_NAME` to update it. Local credentials are only needed for local AWS CLI
or sandbox work; connecting GitHub to Amplify uses the console's service role.
The `.cmd` suffix avoids PowerShell's script-execution restriction on `npx.ps1`.

Use Node.js 24. Copy `.env.example` to `.env` and set local provider keys. For
existing local installations, the old Census variable is accepted by the server
only; rename it to `CENSUS_API_KEY` when convenient. It is excluded from Vite's
browser environment allowlist.

```sh
npm ci
npm run dev
```

```sh
npm run typecheck:backend
npm test
npm run lint
npm run build
npm run check:bundle-secrets
```

To test with an AWS sandbox, authenticate using an AWS profile/SSO outside this
repository, set sandbox secrets with `npx.cmd ampx sandbox secret set CENSUS_API_KEY --profile relointel`
and `npx.cmd ampx sandbox secret set DATA_GOV_API_KEY --profile relointel`, then run
`npm.cmd run sandbox -- --profile relointel`. Sandbox secrets are separate from
deployed branch secrets. Sandbox output makes Vite use the sandbox API URL.

Never paste AWS credentials into project files, GitHub, or chat. Amplify's managed
service role supplies deployment credentials; Lambda uses its execution role.

## Validation notes

Local builds and mocked API tests do not replace the live checks above. The
backend has not been deployed to an AWS account as part of this change.

The repository-wide formatting check currently reports pre-existing issues in
101 untouched files, including generated public datasets. The deployment files
and modified source files are formatted; unrelated files were left unchanged.

The dependency audit still reports 20 advisories (3 moderate, 17 high) in the
Amplify development/tooling dependency tree after compatible updates. The
remaining suggested automatic fixes require breaking Amplify version changes;
those were not applied. These packages are not imported by the frontend or the
Lambda handler. Review newer Amplify releases before production deployment.

## AWS references

- [Gen 2 REST/API Gateway patterns](https://docs.amplify.aws/react/build-a-backend/add-aws-services/rest-api/set-up-rest-api/)
- [Function environment variables and secrets](https://docs.amplify.aws/react/build-a-backend/functions/environment-variables-and-secrets/)
- [Hosting rewrite configuration](https://docs.aws.amazon.com/amplify/latest/userguide/redirect-rewrite-examples.html)
