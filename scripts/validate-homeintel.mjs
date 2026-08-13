import { spawnSync } from 'node:child_process'

const requestedTarget = process.argv[2]

if (requestedTarget && requestedTarget.toLowerCase() !== 'homeintel') {
  console.error(`Unknown validation target: ${requestedTarget}`)
  console.error('Use: npm run validate homeintel')
  process.exit(1)
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const checks = [
  ['run', 'data:update'],
  ['run', 'format:check'],
  ['run', 'lint'],
  ['run', 'build'],
  ['audit'],
]

for (const args of checks) {
  console.log(`\n> ${npmCommand} ${args.join(' ')}`)
  const result = spawnSync(npmCommand, args, {
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('\nHomeIntel data update and validation completed successfully.')
