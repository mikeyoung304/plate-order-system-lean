#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Get ESLint output to identify unused variables
function getUnusedVars() {
  try {
    execSync('npm run lint --silent', { encoding: 'utf8' })
    return []
  } catch (error) {
    const output = error.stdout || error.message
    const unusedVarMatches = output.match(
      /Error: '([^']+)' is (?:defined but never used|assigned a value but never used)\./g
    )

    if (!unusedVarMatches) return []

    return unusedVarMatches.map(match => {
      const varName = match.match(/'([^']+)'/)[1]
      return varName
    })
  }
}

// Fix unused variables by adding underscore prefix
function fixFile(filePath, unusedVars) {
  const content = fs.readFileSync(filePath, 'utf8')
  let updatedContent = content

  unusedVars.forEach(varName => {
    // Skip if already prefixed with underscore
    if (varName.startsWith('_')) return

    // Pattern to match variable declarations/destructuring
    const patterns = [
      // const { varName } = ...
      new RegExp(`(const|let)\\s*{([^}]*)(\\b${varName}\\b)([^}]*)}`, 'g'),
      // const varName = ...
      new RegExp(`(const|let|var)\\s+(${varName})\\s*=`, 'g'),
      // function params
      new RegExp(`\\(([^)]*)(\\b${varName}\\b)([^)]*)\\)`, 'g'),
      // arrow function params
      new RegExp(`=>\\s*\\(([^)]*)(\\b${varName}\\b)([^)]*)\\)`, 'g'),
    ]

    patterns.forEach(pattern => {
      updatedContent = updatedContent.replace(pattern, match => {
        return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`)
      })
    })
  })

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent)
    console.log(`Fixed unused variables in: ${filePath}`)
  }
}

// Get list of TypeScript/JavaScript files
function getTSFiles(dir) {
  const files = []

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules'
      ) {
        traverse(fullPath)
      } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

// Main execution
console.log('🔧 Fixing unused variables...')

const unusedVars = getUnusedVars()
if (unusedVars.length === 0) {
  console.log('✅ No unused variables found!')
  process.exit(0)
}

console.log(`Found ${unusedVars.length} unused variables:`, unusedVars)

const tsFiles = getTSFiles(process.cwd())
const relevantFiles = tsFiles.filter(
  file =>
    !file.includes('node_modules') &&
    !file.includes('.next') &&
    !file.includes('coverage')
)

relevantFiles.forEach(file => {
  try {
    fixFile(file, unusedVars)
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message)
  }
})

console.log('✅ Finished fixing unused variables')
