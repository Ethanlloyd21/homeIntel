import { defineFunction, secret } from '@aws-amplify/backend'

const optionalSecrets = {
  TOMTOM: 'TOMTOM_API_KEY',
  ARCGIS: 'ARCGIS_API_KEY',
  BEA: 'BEA_API_KEY',
  EIA: 'EIA_API_KEY',
} as const

export const api = defineFunction({
  name: 'relointel-api',
  entry: './handler.ts',
  runtime: 22,
  timeoutSeconds: 30,
  memoryMB: 1024,
  environment: {
    CENSUS_API_KEY: secret('CENSUS_API_KEY'),
    DATA_GOV_API_KEY: secret('DATA_GOV_API_KEY'),
    ...Object.fromEntries(
      Object.entries(optionalSecrets)
        .filter(([feature]) => process.env[`ENABLE_${feature}`] === 'true')
        .map(([, name]) => [name, secret(name)]),
    ),
  },
})
