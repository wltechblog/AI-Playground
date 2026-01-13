#!/usr/bin/env node
/**
 * Prepare Python environment for AI Playground build
 * Creates Python environment from embeddable Python in fixed ./build/python-env/ directory
 * Uses fixed directory structure and proper error handling
 */

import { existsSync, mkdirSync, rmSync, readdirSync, writeFileSync, copyFileSync } from 'fs'
import { join, normalize } from 'path'
import { execSync, spawnSync } from 'child_process'
import AdmZip from 'adm-zip'
import { getBuildPaths } from './build-paths.mts'

// Get build paths configuration
const buildPaths = getBuildPaths()
const {
  resourcesDir: RESOURCES_DIR,
  pythonEnvDir: PYTHON_ENV_DIR,
  buildDir,
  resourceFiles,
  pythonEnvDir,
} = buildPaths

interface PythonEnvConfig {
  pythonEmbedZipFile: string
}

/**
 * Verify all required files exist
 */
function verifyFilesExist(): PythonEnvConfig {
  console.log('🔍 Verifying all required files exist... We dont need to do this!')
}

/**
 * Prepare Python environment directory
 */
function preparePythonEnvDir(): void {
  if (existsSync(PYTHON_ENV_DIR)) {
    console.log(`🗑️  Removing existing Python environment: ${PYTHON_ENV_DIR}`)
    rmSync(PYTHON_ENV_DIR, { recursive: true })
  }

  mkdirSync(PYTHON_ENV_DIR, { recursive: true })
  console.log(`📁 Created Python environment directory: ${PYTHON_ENV_DIR}`)
}

/**
 * Create Python environment from embeddable Python zip
 */
function createPythonEnvFromEmbeddableZip(pythonEmbedZipFile: string): void {
  console.log('📦 Extracting embeddable Python...')

  try {
    const pythonEmbed = new AdmZip(pythonEmbedZipFile)
    pythonEmbed.extractAllTo(PYTHON_ENV_DIR, true)
    console.log(`✅ Extracted embeddable Python to: ${PYTHON_ENV_DIR}`)
  } catch (error) {
    console.error(`❌ Failed to extract Python zip: ${error}`)
    process.exit(1)
  }

  // Configure Python path
  console.log('⚙️  Configuring Python environment paths...')

  try {
    // Find the Python version by looking for python*._pth file
    const files = readdirSync(PYTHON_ENV_DIR)
    const pthFilePattern = /^python(\d+)\._pth$/
    let pythonVersion: string | null = null
    let pthFileName: string | null = null

    for (const file of files) {
      const match = file.match(pthFilePattern)
      if (match) {
        pythonVersion = match[1]
        pthFileName = file
        break
      }
    }

    if (!pythonVersion || !pthFileName) {
      console.error('❌ Could not find python*._pth file in the target directory')
      process.exit(1)
    }

    console.log(`🐍 Found Python version: ${pythonVersion} (${pthFileName})`)

    const pthFile = join(PYTHON_ENV_DIR, pthFileName)
    const pthContent = `python${pythonVersion}.zip
.

# Uncomment to run site.main() automatically
import site
`
    writeFileSync(pthFile, pthContent)
    console.log(`✅ Configured Python paths in ${pthFileName}`)
  } catch (error) {
    console.error(`❌ Failed to configure Python paths: ${error}`)
    process.exit(1)
  }
}


/**
 * Compress Python environment using 7-Zip
 */
function compressPythonEnvironment(): void {
  const targetArchive = resourceFiles.pythonEnvArchive

  console.log(`📦 Compressing Python environment...`)
  console.log(`   Source: ${pythonEnvDir}`)
  console.log(`   Target: ${targetArchive}`)

  try {
    // Remove existing archive
    if (existsSync(targetArchive)) {
      console.log(`🗑️  Removing existing archive: ${targetArchive}`)
      rmSync(targetArchive, { recursive: true })
    }

    // Compress Python environment
    const result = spawnSync(
      resourceFiles.sevenZipExe,
      ['a', targetArchive, join(pythonEnvDir, '*')],
      {
        stdio: 'inherit',
        cwd: buildDir,
      },
    )

    if (result.status !== 0) {
      console.error('❌ Failed to compress Python environment')
      process.exit(1)
    }

    console.log(`✅ Python environment compressed to: ${targetArchive}`)
  } catch (error) {
    console.error(`❌ Error compressing Python environment: ${error}`)
    process.exit(1)
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Python environment preparation...')
  console.log(`📂 Repository Root: ${buildPaths.repoRoot}`)
  console.log(`📂 Target directory: ${buildPaths.pythonEnvDir}`)

  console.log(` This stuff doesn't make sense on linux/docker`)
}
