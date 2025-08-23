# Scanner Data Table

## Project Structure

```
src/
├── components/          # React components
│   ├── DataTable.tsx   # Main table component
│   ├── DataTableColumns.tsx # Table columns component
│   ├── NetworkLogo.tsx # Network icons component
│   └── TableFilters.tsx # Filter controls
├── lib/                # Hooks, utilities, API
│   ├── hooks/          # Custom React hooks
│   ├── api/            # API client and types
│   └── utils/          # Helper functions
└── assets/             # Icons and images
    └── icons/          # Network and social icons

```

## Quick Start

```bash
# Install dependencies
npm install
# or
yarn

# Start development server
npm run dev
# or
yarn dev
```

## Live Demo

🌐 **Live Application**: [https://keen-rolypoly-08554d.netlify.app/](https://keen-rolypoly-08554d.netlify.app/)

## Dependencies

### Core

- **React 19.1.1** - UI framework
- **TypeScript 5.8.3** - Type safety and development experience
- **Vite 7.1.2** - Build tool and dev server

### UI & Table

- **@tanstack/react-table 8.21.3** - Headless table library for sorting, filtering, and data management
- **Tailwind CSS 3.4.0** - Utility-first CSS framework for styling

### Data Fetching & State

- **@tanstack/react-query 5.85.5** - Server state management, caching, and infinite scrolling
- **Axios 1.11.0** - HTTP client for API requests

### Real-time Updates

- **WebSocket** - Custom hook for real-time data streaming
- **Custom hooks** - Modular state management for table data and WebSocket connections
