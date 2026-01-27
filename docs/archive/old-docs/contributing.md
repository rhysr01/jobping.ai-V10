# Contributing Guide

## Welcome! 🎉

Thank you for your interest in contributing to JobPing! We welcome contributions from developers of all skill levels. This guide will help you get started.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## Getting Started

### Prerequisites
- **Node.js 18+** - Required for Next.js 14 and React 19
- **Git** - Version control
- **Supabase account** - For database development
- **OpenAI API key** - For AI features

### Local Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/jobping.git
   cd jobping
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Database Setup**
   ```bash
   npm run db:migrate
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Choose an Issue
- Check [GitHub Issues](https://github.com/your-org/jobping/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Write clear, focused commits
- Test your changes thoroughly
- Follow our coding standards

### 4. Test Your Changes
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### 5. Update Documentation
- Update relevant documentation in `/docs`
- Add JSDoc comments for new functions
- Update API documentation if endpoints change

### 6. Submit a Pull Request
- Push your branch to GitHub
- Create a Pull Request with a clear description
- Reference any related issues

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Strict type checking enabled
- Use interfaces for complex objects
- Avoid `any` types

### Code Style
```typescript
// Good: Clear variable names, consistent formatting
async function processUserSignup(userData: UserInput): Promise<User> {
  const validatedData = validateUserData(userData);
  const user = await createUser(validatedData);
  return user;
}

// Avoid: Unclear names, inconsistent formatting
async function proc(data) {
const x=validate(data);const y=await create(x);return y}
```

### Component Structure
```typescript
// Use functional components with hooks
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### API Design
```typescript
// RESTful endpoints with consistent error handling
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData(request);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing

### Test Categories
- **Unit Tests**: Pure functions, utilities, isolated components
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Complete user journeys, cross-browser compatibility

### Writing Tests
```typescript
describe('UserSignup', () => {
  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const result = await createUser(userData);

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(userData.email);
  });

  it('should reject invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      name: 'Test User'
    };

    await expect(createUser(userData)).rejects.toThrow('Invalid email');
  });
});
```

### Test Coverage Requirements
- **Branches**: 80% minimum
- **Functions**: 85% minimum
- **Lines**: 85% minimum
- **Statements**: 85% minimum

## Submitting Changes

### Commit Messages
Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(auth): add Google OAuth login
fix(api): handle rate limiting in job matching
docs(readme): update setup instructions
```

### Pull Request Process

1. **Create PR**: Use the GitHub interface
2. **Title**: Clear, descriptive title
3. **Description**: Include:
   - What changes were made
   - Why they were needed
   - How to test the changes
   - Screenshots for UI changes
4. **Labels**: Add appropriate labels
5. **Review**: Address reviewer feedback
6. **Merge**: Squash and merge approved PRs

### PR Template
```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

## Reporting Issues

### Bug Reports
Please include:
- **Steps to reproduce**: Detailed steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, Node version
- **Error messages**: Full error output
- **Screenshots**: If UI-related

### Feature Requests
Please include:
- **Problem**: What's the problem this solves?
- **Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Use cases**: Who would use this and how?

## Recognition

Contributors will be recognized in:
- GitHub repository contributors list
- Release notes for significant contributions
- Project documentation

## Development Setup

### AI Testing Environment Setup

For contributors working on AI matching features, you'll need to set up API keys for testing:

#### Required Environment Variables
```bash
# AI Testing Environment Variables
OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

#### Getting API Keys

1. **OpenAI API Key**:
   - Visit https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - **Never commit this to git!**

2. **Supabase Keys**:
   - Go to https://supabase.com/dashboard
   - Select your project → Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

#### Setting Up Environment Variables

**Option 1: .env.local file (Recommended)**
```bash
# Add to your .env.local file (already in .gitignore)
OPENAI_API_KEY=sk-your-actual-openai-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

**Option 2: Terminal Export (Temporary)**
```bash
export OPENAI_API_KEY="sk-your-key"
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

#### Testing Your Setup
```bash
# Quick health check
npm run test:ai-check

# Comprehensive AI testing
npm run test:ai-comprehensive
```

**Cost Considerations**: ~$0.01-0.05 per test run. Monitor usage in your OpenAI dashboard.

### Local Development Environment

#### Multi-Environment Setup
```bash
# Create different .env files for various environments
cp .env.example .env.local      # Development
cp .env.example .env.staging    # Staging testing
cp .env.example .env.production # Production simulation
```

#### Docker Development Environment
```yaml
# docker-compose.yml for full local stack
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: jobping_dev
      POSTGRES_USER: jobping
      POSTGRES_PASSWORD: dev_password
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailhog:
    image: mailhog/mailhog:latest
    ports: ["1025:1025", "8025:8025"]  # SMTP/Web interface
```

## Getting Help

- **Documentation**: Check `/docs` folder first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord/Slack**: Join our community chat

Thank you for contributing to JobPing! 🚀