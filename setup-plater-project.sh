#!/bin/bash

# Plater Order System - Project Setup Script
# This script automates the initial setup of the Plater project

set -e

echo "🍽️  Setting up Plater Order System..."

# Check for required tools
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }

# Create project structure if needed
echo "📁 Setting up project structure..."
mkdir -p .claude/commands
mkdir -p lib/modassembly/{supabase/{database,auth},audio-recording,openai}
mkdir -p supabase/migrations
mkdir -p app/{api,"(auth)"/{admin,server,kitchen,bar,expo}}
mkdir -p components/{ui,orders,tables,voice}
mkdir -p hooks
mkdir -p types
mkdir -p scripts

# Copy configuration files
echo "📝 Creating configuration files..."

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    cat > .env.example << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://eiipozoogrrfudhjoqms.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
fi

# Create package.json scripts if needed
echo "📦 Updating package.json scripts..."
npm pkg set scripts.dev="next dev"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="next start"
npm pkg set scripts.lint="next lint"
npm pkg set scripts.lint:fix="next lint --fix"
npm pkg set scripts.type-check="tsc --noEmit"
npm pkg set scripts.format="prettier --write ."
npm pkg set scripts.test="jest"
npm pkg set scripts.test:unit="jest --testPathPattern=unit"
npm pkg set scripts.test:integration="jest --testPathPattern=integration"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.supabase:start="supabase start"
npm pkg set scripts.supabase:stop="supabase stop"
npm pkg set scripts.supabase:status="supabase status"
npm pkg set scripts.supabase:migrate="supabase db push"
npm pkg set scripts.prepare="husky install"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install dev dependencies
echo "📦 Installing dev dependencies..."
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  typescript \
  eslint \
  eslint-config-next \
  prettier \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  husky \
  pre-commit

# Install MCP servers globally
echo "🤖 Installing MCP servers..."
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @wonderwhy-er/desktop-commander

# Setup git hooks
echo "🔗 Setting up git hooks..."
npx husky install
pre-commit install

# Create TypeScript config if needed
if [ ! -f tsconfig.json ]; then
    echo "📝 Creating TypeScript configuration..."
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

# Create Prettier config
if [ ! -f .prettierrc ]; then
    echo "📝 Creating Prettier configuration..."
    cat > .prettierrc << EOF
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always"
}
EOF
fi

# Create ESLint config
if [ ! -f .eslintrc.json ]; then
    echo "📝 Creating ESLint configuration..."
    cat > .eslintrc.json << EOF
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
EOF
fi

# Create check-env script
echo "📝 Creating environment check script..."
cat > scripts/check-env.sh << 'EOF'
#!/bin/bash
required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "OPENAI_API_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=($var)
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '%s\n' "${missing_vars[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"
EOF
chmod +x scripts/check-env.sh

# Initialize Supabase if not already done
if [ ! -f supabase/config.toml ]; then
    echo "🗄️  Initializing Supabase..."
    npx supabase init
fi

# Final setup
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'claude' in the project directory to start Claude Code"
echo ""
echo "📚 Reference documents:"
echo "- CLAUDE.md: Project conventions and architecture"
echo "- .claude/commands/: Custom Claude commands"
echo "- prompt_templates.md: Feature development templates"
echo ""
echo "Happy coding! 🚀"
