import assert from 'node:assert/strict'
import { transformSync, version } from 'esbuild'

// Exercise the native binary, not just package resolution, before CDK can fall
// back to Docker (which is unavailable in the standard Amplify build image).
const result = transformSync('const value: number = 1; export { value }', {
  loader: 'ts',
  platform: 'node',
  format: 'cjs',
})
assert.ok(result.code.includes('value'))
console.log(`Local esbuild ${version} is available for Lambda bundling.`)
