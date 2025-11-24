# React Expert Skill

Expert assistance for building modern React applications with hooks, TypeScript, and best practices.

## What This Skill Covers

- **Components** - Functional components with props and state
- **Hooks** - useState, useEffect, useCallback, useMemo, custom hooks
- **TypeScript** - Type-safe React development
- **Performance** - Optimization techniques and patterns
- **State Management** - Local state, context, and patterns
- **Forms** - Controlled components and validation
- **Testing** - Component testing with React Testing Library

## Quick Reference

### Basic Component

```tsx
interface Props {
  title: string;
}

export const Component: FC<Props> = ({ title }) => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
};
```

## When to Use

Use this skill when:
- Building React applications
- Working with React hooks
- Implementing TypeScript with React
- Optimizing React performance
- Managing component state
- Creating custom hooks
- Testing React components

## Key Features

- Modern React patterns (hooks, functional components)
- TypeScript integration
- Performance optimization
- Best practices and conventions
- Testing strategies

---

**Version:** 1.0.0
**Last Updated:** 2024-11-24
