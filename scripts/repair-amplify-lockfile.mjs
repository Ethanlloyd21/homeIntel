import { readFileSync, writeFileSync } from 'node:fs'

// npm drops/records inconsistent nested bundle entries for these releases.
// https://github.com/npm/cli/issues/9821
// Metadata below matches npm's resolved ideal tree and registry integrity hashes.
const path = new URL('../package-lock.json', import.meta.url)
const lock = JSON.parse(readFileSync(path, 'utf8'))
const bundles = {
  '@aws-amplify/data-construct': '1.17.7',
  '@aws-amplify/graphql-api-construct': '1.22.2',
}
const core = {
  version: '2.0.0',
  resolved: 'https://registry.npmjs.org/@opentelemetry/core/-/core-2.0.0.tgz',
  integrity:
    'sha512-SLX36allrcnVaPYG3R78F/UZZsBsvbc7lMCLx37LyH5MJ1KAAZ2E3mW9OAD3zGz0G8q/BtoS5VUrjzDydhD6LQ==',
  dev: true,
  inBundle: true,
  license: 'Apache-2.0',
  dependencies: { '@opentelemetry/semantic-conventions': '^1.29.0' },
  engines: { node: '^18.19.0 || >=20.6.0' },
  peerDependencies: { '@opentelemetry/api': '>=1.0.0 <1.10.0' },
}

for (const [name, version] of Object.entries(bundles)) {
  const root = `node_modules/${name}`
  if (lock.packages[root]?.version !== version) {
    throw new Error(
      `${name} changed; review whether the upstream bundle workaround is still needed.`,
    )
  }
  for (const [dependency, expected] of [
    ['zod', '3.25.17'],
    ['semver', '7.8.5'],
  ]) {
    const source =
      lock.packages[
        `node_modules/@aws-amplify/backend-cli/node_modules/${dependency}`
      ]
    if (source?.version !== expected || !source.integrity) {
      throw new Error(
        `Expected verified ${dependency}@${expected} metadata in the CLI dependency tree.`,
      )
    }
    lock.packages[`${root}/node_modules/${dependency}`] = {
      ...source,
      inBundle: true,
    }
  }
  for (const parent of ['resources', 'sdk-trace-base']) {
    lock.packages[
      `${root}/node_modules/@opentelemetry/${parent}/node_modules/@opentelemetry/core`
    ] = { ...core }
  }
}
lock.packages = Object.fromEntries(
  Object.entries(lock.packages).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  ),
)
writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`)
console.log(
  'Repaired the eight affected Amplify bundled dependency entries. Run npm ci --dry-run to verify.',
)
