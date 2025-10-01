# Contributing to Sports Companion Backend

Thank you for your interest in contributing to the Sports Companion Backend! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0 (optional, for caching)
- Git

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sportificatoin-be.git
   cd sportificatoin-be
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.development .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript Guidelines

- **Use TypeScript strict mode**: All code must comply with TypeScript strict mode
- **Avoid `any` types**: Always define proper interfaces and types
- **Use explicit return types**: For public methods and complex functions
- **Follow naming conventions**:
  - Classes: `PascalCase` (e.g., `UserController`)
  - Interfaces: `PascalCase` with `I` prefix (e.g., `IUser`)
  - Variables/Functions: `camelCase` (e.g., `getUserById`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS`)
  - Private members: prefix with `_` (e.g., `_validateInput`)

### Code Style

We use ESLint to enforce code style. Before committing:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues where possible
npm run lint:fix
```

### Key Rules

- **No unused variables**: Remove or prefix with `_` if intentionally unused
- **Use `const` by default**: Only use `let` when reassignment is needed
- **No `var` declarations**: Use `const` or `let` instead
- **Use strict equality**: Always use `===` and `!==` (not `==` or `!=`)
- **No console.log**: Use the logger utility instead
- **Async/await**: Prefer async/await over raw promises
- **Error handling**: Always handle errors properly, use try-catch or error handlers

### File Organization

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/          # Database models (Mongoose schemas)
├── routes/          # Route definitions
├── services/        # Business logic services
├── utils/           # Helper functions
├── validators/      # Input validation schemas
└── types/           # TypeScript type definitions
```

### Documentation

- **JSDoc comments**: Add JSDoc comments for all public methods
- **Inline comments**: Explain complex logic, algorithms, or business rules
- **README updates**: Update relevant documentation when adding features
- **API documentation**: Update Swagger/OpenAPI specs for new endpoints

### Example of Well-Documented Code

```typescript
/**
 * Retrieves user profile with enhanced analytics
 * 
 * @param userId - The unique identifier of the user
 * @param options - Optional parameters for data retrieval
 * @returns Promise resolving to user profile with analytics
 * @throws {NotFoundError} When user doesn't exist
 * @throws {ValidationError} When userId is invalid
 */
async function getUserProfile(
  userId: string, 
  options?: ProfileOptions
): Promise<UserProfile> {
  // Validate input
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid user ID format');
  }

  // Retrieve user with related data
  const user = await User.findById(userId)
    .populate('profile')
    .select('-password'); // Never expose passwords

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
```

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Add/update tests
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run lint      # Check linting
   npm run build     # Ensure build succeeds
   npm test          # Run tests
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   See [Commit Message Guidelines](#commit-message-guidelines) for format.

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure CI checks pass

### Pull Request Checklist

- [ ] Code follows the project's coding standards
- [ ] All tests pass
- [ ] New code has appropriate test coverage
- [ ] Documentation has been updated
- [ ] Commit messages follow the conventional commit format
- [ ] No merge conflicts
- [ ] PR description clearly explains the changes

## Testing Guidelines

### Writing Tests

- Place test files next to the code they test
- Use descriptive test names: `should return 404 when user not found`
- Test edge cases and error conditions
- Mock external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

```typescript
describe('UserController', () => {
  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUser = { id: userId, email: 'test@example.com' };
      
      // Act
      const result = await UserController.getProfile(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      
      // Act & Assert
      await expect(
        UserController.getProfile(userId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no code change)
- `refactor`: Code refactoring (no feature change or bug fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build, etc.)
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(auth): add OAuth2 authentication support

# Bug fix
fix(api): resolve issue with user profile update

# Documentation
docs(readme): add installation instructions

# Refactoring
refactor(controllers): extract common validation logic

# Performance
perf(database): optimize query for user search
```

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead, email security@example.com with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- Never commit secrets or credentials
- Always validate and sanitize user input
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Keep dependencies up to date
- Follow the principle of least privilege

## Questions?

- Check existing documentation in `/docs`
- Review the [API Documentation](API_DOCUMENTATION.md)
- Look at existing code for examples
- Ask questions in GitHub Discussions
- Join our community chat (if available)

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Sports Companion Backend! 🚀
