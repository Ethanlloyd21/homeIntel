import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const secrets = Object.entries(env)
  .filter(
    ([name, value]) =>
      /(?:API_KEY|ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)$/.test(name) &&
      value?.length >= 8,
  )
  .filter(([, value]) => !value.startsWith('your_'))

const scan = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await scan(path)
      continue
    }
    const data = await readFile(path)
    for (const [name, value] of secrets) {
      if (
        [value, encodeURIComponent(value)].some((candidate) =>
          data.includes(Buffer.from(candidate)),
        )
      ) {
        throw new Error(
          `Secret ${name} was found in ${path}; refusing to publish. Values are not logged.`,
        )
      }
    }
    if (/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/.test(data.toString('utf8'))) {
      throw new Error(
        `An AWS access key identifier was found in ${path}; refusing to publish.`,
      )
    }
  }
}

await scan('dist')
console.log(
  'Built assets contain no configured secret values or AWS access key identifiers.',
)
