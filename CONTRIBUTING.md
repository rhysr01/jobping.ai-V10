# 🤝 Contributing to JobPing

Welcome! We're excited that you're interested in contributing to JobPing. This document provides guidelines and information for contributors.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤟 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- Git

### Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/jobping.ai.git
cd jobping.ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint:biome   # Run linter
npm run type-check   # Run TypeScript checks
npm test            # Run unit tests
npm run test:e2e    # Run E2E tests
```

## 🔄 Development Workflow

### 1. Choose an Issue
- Check our [GitHub Issues](https://github.com/rhysr01/jobping.ai/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes
- Write clear, concise commit messages
- Follow our coding standards
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes
```bash
# Run the full test suite
npm run test:all

# Run accessibility tests
npm run test:e2e:accessibility

# Test performance
npm run test:e2e:performance
```

### 5. Submit a Pull Request
- Ensure your branch is up to date with main
- Fill out the PR template completely
- Request review from maintainers

## 📝 Pull Request Process

### PR Requirements
- [ ] All tests pass
- [ ] Code follows our style guidelines
- [ ] Documentation is updated
- [ ] PR description is clear and complete
- [ ] No merge conflicts

### PR Review Process
1. **Automated Checks**: CI/CD pipeline runs all tests
2. **Code Review**: Maintainers review code quality and architecture
3. **Testing**: Additional manual testing if needed
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash merge with descriptive commit message

## 💻 Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all new code
- Strict type checking enabled
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React/Next.js
- Use functional components with hooks
- Follow our component structure patterns
- Use custom hooks for reusable logic
- Implement proper error boundaries

### CSS/Tailwind
- Use Tailwind utility classes
- Follow our design system tokens
- Ensure responsive design
- Test across different screen sizes

### File Organization
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── styles/        # Global styles and themes
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Accessibility Tests**: Ensure WCAG compliance
- **Performance Tests**: Monitor Core Web Vitals

### Writing Tests
```typescript
// Unit test example
describe('formatSalary', () => {
  it('should format salary ranges correctly', () => {
    expect(formatSalary({ min: 50000, max: 70000 })).toBe('€50,000 - €70,000');
  });
});

// E2E test example
test('complete signup flow', async ({ page }) => {
  await page.goto('/signup/free');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/signup\/success/);
});
```

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex business logic
- Include usage examples in comments

### User Documentation
- Update README for new features
- Add migration guides for breaking changes
- Maintain API documentation

### Commit Messages
```
feat: add user authentication system
fix: resolve mobile navigation issue
docs: update API documentation
style: format code with biome
refactor: simplify component structure
test: add accessibility test coverage
```

## 🎯 Areas for Contribution

### High Priority
- **Performance Optimization**: Core Web Vitals improvements
- **Accessibility**: WCAG compliance enhancements
- **Mobile UX**: Responsive design improvements
- **Testing**: Additional test coverage

### Medium Priority
- **UI Components**: New reusable components
- **API Development**: Backend feature development
- **Documentation**: Improve developer experience
- **Internationalization**: Multi-language support

### Future Opportunities
- **AI/ML Features**: Enhanced job matching algorithms
- **Analytics**: Advanced user behavior insights
- **Integrations**: Third-party service connections
- **Mobile App**: React Native companion app

## 💬 Getting Help

- **📧 Email**: hello@jobping.ai
- **🐛 Issues**: [GitHub Issues](https://github.com/rhysr01/jobping.ai/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/rhysr01/jobping.ai/discussions)

## 🙏 Recognition

Contributors are recognized in our:
- [Contributors List](https://github.com/rhysr01/jobping.ai/graphs/contributors)
- Release notes
- Social media mentions

Thank you for contributing to JobPing! Your efforts help make job searching simpler for everyone. 🚀