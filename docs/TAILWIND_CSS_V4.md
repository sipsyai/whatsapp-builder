# Tailwind CSS v4 Configuration Guide

WhatsApp Builder frontend uses Tailwind CSS v4 with PostCSS integration.

## Overview

Tailwind CSS v4 is a major update that introduces:
- New `@import` and `@theme` directives
- PostCSS plugin architecture
- Improved performance
- Better customization options

## Configuration Files

### 1. PostCSS Configuration

**File**: `frontend/postcss.config.js`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

This configuration tells PostCSS to use the Tailwind CSS v4 plugin for processing CSS files.

### 2. Tailwind Configuration

**File**: `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          light: '#DCF8C6',
        },
        secondary: {
          DEFAULT: '#34B7F1',
        },
        background: {
          DEFAULT: '#ECE5DD',
          chat: '#FFFFFF',
          message: '#E1F5C4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**Custom Colors**:
- `primary`: WhatsApp green (#25D366)
- `primary-dark`: Darker green (#128C7E)
- `primary-light`: Light green for messages (#DCF8C6)
- `secondary`: Blue accent (#34B7F1)
- `background`: Chat background beige (#ECE5DD)
- `background-chat`: White for chat containers
- `background-message`: Light green for message bubbles

**Custom Font**:
- `font-sans`: Inter font family with system fallbacks

### 3. Main CSS File

**File**: `frontend/src/styles/index.css`

```css
@import "tailwindcss";

@theme {
  /* Custom color palette */
  --color-primary: #25D366;
  --color-primary-dark: #128C7E;
  --color-primary-light: #DCF8C6;

  --color-secondary: #34B7F1;

  --color-background: #ECE5DD;
  --color-background-chat: #FFFFFF;
  --color-background-message: #E1F5C4;

  /* Custom font family */
  --font-family-sans: Inter, system-ui, sans-serif;
}

/* Base styles */
body {
  font-family: var(--font-family-sans);
  background-color: var(--color-background);
}
```

**Tailwind v4 Syntax**:
- `@import "tailwindcss"`: Imports Tailwind base, components, and utilities
- `@theme { }`: Defines custom theme variables (new in v4)
- CSS variables: `--color-*`, `--font-family-*` for easy customization

### 4. HTML Integration

**File**: `frontend/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WhatsApp Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Note**: No CDN script needed - Tailwind is processed at build time via PostCSS.

## Package Dependencies

**File**: `frontend/package.json`

```json
{
  "dependencies": {
    // ... other dependencies
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

**Packages**:
- `tailwindcss@4.0.0`: Core Tailwind CSS v4
- `@tailwindcss/postcss@4.0.0`: PostCSS plugin for Tailwind v4
- `postcss@8.4.47`: PostCSS processor
- `autoprefixer@10.4.20`: Adds vendor prefixes automatically

## Usage Examples

### Using Custom Colors

```tsx
// Primary color
<button className="bg-primary text-white hover:bg-primary-dark">
  Send Message
</button>

// Message bubble
<div className="bg-background-message p-3 rounded-lg">
  Hello, WhatsApp!
</div>

// Chat container
<div className="bg-background-chat shadow-lg rounded-xl">
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
</div>
```

### Using Custom Font

```tsx
// Already applied globally via body
<p className="font-sans text-lg">
  This uses the Inter font
</p>

// Override with system font
<p className="font-system">
  This uses system font
</p>
```

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {chatbots.map(bot => (
    <ChatBotCard key={bot.id} bot={bot} />
  ))}
</div>
```

### Dark Mode Support (Future)

```tsx
// Tailwind v4 dark mode
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  <h1>Supports dark mode</h1>
</div>
```

## Build Process

### Development

```bash
cd frontend
npm run dev
```

Vite watches for CSS changes and rebuilds with Tailwind automatically.

### Production Build

```bash
cd frontend
npm run build
```

**Build Steps**:
1. Vite processes `index.css` with PostCSS
2. PostCSS runs `@tailwindcss/postcss` plugin
3. Tailwind scans `content` files for class usage
4. Generates optimized CSS with only used classes
5. Autoprefixer adds vendor prefixes
6. Output: `dist/assets/index-[hash].css` (~50KB gzipped)

### Production Optimizations

Tailwind v4 automatically:
- Removes unused CSS (tree-shaking)
- Minifies output
- Optimizes class names
- Generates source maps

**Size Comparison**:
- Full Tailwind CSS: ~3.5MB
- Production build: ~50KB gzipped (99% smaller)

## Migration from CDN to Build-time

**Before** (CDN):
```html
<!-- Old approach -->
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#25D366',
        }
      }
    }
  }
</script>
```

**After** (Build-time):
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#25D366',
      }
    }
  }
}
```

**Benefits**:
- Faster page load (no runtime processing)
- Smaller CSS file size
- Better IDE support (IntelliSense)
- Production-ready optimization
- Consistent builds

## Customization

### Adding New Colors

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      accent: {
        DEFAULT: '#FF5722',
        light: '#FFAB91',
        dark: '#E64A19',
      }
    }
  }
}
```

```tsx
// Usage
<div className="bg-accent text-white">
  Accent color
</div>
```

### Adding Custom Utilities

```css
/* index.css */
@theme {
  /* Custom spacing */
  --spacing-chat: 12px;
}

/* Custom utility class */
.chat-spacing {
  padding: var(--spacing-chat);
}
```

### Extending Typography

```javascript
// tailwind.config.js
theme: {
  extend: {
    fontSize: {
      'message': ['14px', '20px'],
      'timestamp': ['11px', '14px'],
    }
  }
}
```

```tsx
<p className="text-message">Message content</p>
<span className="text-timestamp text-gray-500">10:30 AM</span>
```

## VS Code Integration

Install Tailwind CSS IntelliSense extension:

```json
// .vscode/settings.json (recommended)
{
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

**Features**:
- Autocomplete for Tailwind classes
- CSS preview on hover
- Linting for invalid classes
- Color preview

## Troubleshooting

### Classes Not Applying

**Issue**: Tailwind classes in component don't work

**Solution**:
1. Check `content` array in `tailwind.config.js` includes your file pattern
2. Restart dev server: `npm run dev`
3. Clear Vite cache: `rm -rf node_modules/.vite`

### Build Size Too Large

**Issue**: Production CSS is larger than expected

**Solution**:
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Remove unused paths
  ],
  // ...
}
```

### Custom Colors Not Working

**Issue**: Custom colors defined but not available

**Solution**:
1. Check syntax in `tailwind.config.js`
2. Ensure `@theme` block in `index.css` uses correct variable names
3. Restart dev server

### PostCSS Errors

**Issue**: `@tailwindcss/postcss` not found

**Solution**:
```bash
cd frontend
npm install --save-dev @tailwindcss/postcss
npm install --save-dev tailwindcss@4.0.0
```

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [PostCSS Documentation](https://postcss.org/)
- [Vite + Tailwind Setup](https://tailwindcss.com/docs/guides/vite)

## Summary

WhatsApp Builder uses Tailwind CSS v4 with:
- PostCSS build-time processing
- Custom WhatsApp-themed color palette
- Inter font family
- Production optimizations
- ~50KB gzipped CSS bundle

**Key Differences from v3**:
- New `@import "tailwindcss"` syntax
- `@theme { }` block for CSS variables
- `@tailwindcss/postcss` plugin required
- Better performance and smaller bundle size
