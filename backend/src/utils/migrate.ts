import { exec } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import path from 'path'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function runMigrations() {
  try {
    console.log('Running database migrations...')
    const backendPath = path.join(__dirname, '../..')
    // Use npx to run prisma from node_modules
    const { stdout, stderr } = await execAsync('npx --yes prisma migrate deploy', {
      cwd: backendPath,
      env: { ...process.env },
    })
    console.log(stdout)
    if (stderr && !stderr.includes('warning')) {
      console.error(stderr)
    }
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    // Don't throw - allow server to start even if migrations fail
    // (they might have already been run)
  }
}

