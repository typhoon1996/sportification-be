# Code Quality & Pre-commit Hooks

This project uses automated code quality checks to maintain high standards.

## Setup Pre-commit Hooks (Optional but Recommended)

### Quick Setup

To enable automatic code quality checks before each commit:

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"
```

### Configure lint-staged

Add to your `package.json`:

```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Add npm scripts

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

## What Gets Checked

### Pre-commit (Automatic)

When you commit code, these checks run automatically:

1. **ESLint**: Checks for code quality issues
2. **Prettier**: Formats code consistently
3. **TypeScript**: Ensures type safety

### Pre-push (Recommended)

Add a pre-push hook to run tests before pushing:

```bash
npx husky add .husky/pre-push "npm test"
```

## Manual Checks

You can run these commands manually at any time:

```bash
# Lint all TypeScript files
npm run lint

# Fix auto-fixable linting issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without changing files
npm run format:check

# Run tests
npm test

# Build the project
npm run build
```

## CI/CD Integration

Our GitHub Actions workflow automatically runs:

- ESLint checks
- TypeScript compilation
- Unit tests
- Build verification

All checks must pass before a PR can be merged.

## Bypassing Hooks (Not Recommended)

In rare cases where you need to bypass hooks:

```bash
# Bypass pre-commit hook
git commit --no-verify -m "your message"

# Bypass pre-push hook
git push --no-verify
```

⚠️ **Warning**: Only bypass hooks when absolutely necessary and you understand the implications.

## Troubleshooting

### Hooks not running?

```bash
# Ensure husky is properly installed
npx husky install

# Check that hooks are executable
chmod +x .husky/*
```

### ESLint errors on commit?

```bash
# Fix automatically where possible
npm run lint:fix

# Check what still needs manual fixing
npm run lint
```

### Prettier conflicts with ESLint?

We've configured ESLint and Prettier to work together. If you encounter conflicts:

1. Update both tools to latest versions
2. Ensure `.prettierrc` and `.eslintrc.js` are in sync
3. Run `npm run format` to apply Prettier formatting

## Benefits

✅ Consistent code style across the project
✅ Catch bugs before they reach CI/CD
✅ Faster code review process
✅ Better code quality
✅ Reduced merge conflicts

---

For more information, see [CONTRIBUTING.md](./CONTRIBUTING.md)
