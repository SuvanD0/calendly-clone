# Solid.js Setup Guide

This project uses Solid.js as the frontend framework. Here's how it's configured and how to work with it.

## Current Setup

### Dependencies
- `solid-js` - Core framework
- `@solidjs/router` - Routing library
- `@solidjs/vite-plugin` - Vite plugin for Solid.js

### Project Structure
```
src/
├── App.tsx          # Main app component with routes
├── index.tsx        # Entry point
├── index.css        # Global styles
├── pages/           # Page components
│   ├── Home.tsx
│   ├── Booking.tsx
│   ├── Login.tsx
│   └── Dashboard.tsx
└── lib/
    └── api.ts       # API client utilities
```

## Key Solid.js Features Used

### 1. Reactive State
Solid.js uses fine-grained reactivity. Use `createSignal` for reactive state:

```typescript
import { createSignal } from 'solid-js';

const [count, setCount] = createSignal(0);
setCount(count() + 1); // Access with () and update with setter
```

### 2. Effects
Use `createEffect` for side effects:

```typescript
import { createEffect } from 'solid-js';

createEffect(() => {
  console.log('Count is:', count());
});
```

### 3. Routing
Using `@solidjs/router`:

```typescript
import { Routes, Route, A } from '@solidjs/router';

// Define routes
<Routes>
  <Route path="/" component={Home} />
  <Route path="/booking" component={Booking} />
</Routes>

// Navigation links
<A href="/booking">Go to Booking</A>
```

### 4. Component Structure
Components are functions that return JSX:

```typescript
export default function MyComponent() {
  const [data, setData] = createSignal(null);
  
  return (
    <div>
      <h1>My Component</h1>
      {data() && <p>{data()}</p>}
    </div>
  );
}
```

## Development

### Run Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Best Practices

1. **Reactivity**: Always access signals with `()` - `count()` not `count`
2. **Conditional Rendering**: Use `{condition() && <Component />}` or `<Show when={condition()}>`
3. **Lists**: Use `<For>` component for lists:
   ```typescript
   <For each={items()}>{(item) => <div>{item.name}</div>}</For>
   ```
4. **Props**: Props are reactive by default - no need to wrap in signals
5. **Lifecycle**: Use `onMount`, `onCleanup` for lifecycle hooks

## Resources

- [Solid.js Documentation](https://docs.solidjs.com/)
- [Solid.js Router](https://github.com/solidjs/solid-router)
- [Solid.js Examples](https://www.solidjs.com/examples)

