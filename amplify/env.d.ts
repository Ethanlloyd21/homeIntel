// Offline typechecking fallback. Amplify generates the runtime module at deploy time.
// This file contains no values and does not replace Amplify's secret resolution.
declare module '$amplify/env/relointel-api' {
  export const env: Readonly<Record<string, string>>
}
