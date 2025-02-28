# Build Troubleshooting Guide

## Common "Missing script: 'build'" Issues and Solutions

If you're still encountering the "Missing script: 'build'" error after adding the build script to your package.json, consider these potential issues:

### 1. Wrong Directory

Make sure you're running npm commands in the project root directory where package.json is located:

```bash
# Check current directory
pwd

# Make sure you see package.json
ls -la
```

### 2. Cached package.json

If your deployment platform is caching an old version:

```bash
# For Netlify
git commit -m "Force rebuild"
git push

# Or clear cache in your deployment platform's dashboard
```

### 3. Environment Variables

Some deployment platforms use specific environment variables:

```bash
# Example for Netlify
NODE_ENV=production npm run build
```

### 4. Check for typos

Ensure there are no invisible characters or typos in your package.json scripts section.

### 5. Node Version Issues

Make sure you're using a compatible Node.js version:

```bash
# Check node version
node -v

# If using nvm, set the correct version
nvm use 16  # or whatever version you need
```

### 6. Package.json is Valid

Verify your package.json is valid JSON:

```bash
cat package.json | jq .
```

If this command fails, your JSON likely has a syntax error.
