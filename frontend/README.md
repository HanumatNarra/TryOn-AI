# TryOn.AI Frontend

React + TypeScript frontend for AI-powered virtual wardrobe and styling platform.

## Features

- Virtual wardrobe management
- AI fashion chatbot
- Virtual try-on visualization
- Personalized outfit suggestions
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Authentication with Supabase

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router v7
- **Backend Integration**: Axios
- **Authentication**: Supabase
- **Icons**: Lucide React

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd frontend

# Install dependencies
npm install
```

### Environment Variables

Create `.env.local` in the frontend directory:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running the Application

### Development Mode

```bash
# From frontend directory
npm run dev

# App will be available at http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker

```bash
# Build Docker image
docker build -t tryon-ai-frontend .

# Run container
docker run -p 5173:5173 tryon-ai-frontend

# Or use Docker Compose from project root
cd ..
docker-compose up frontend
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication components
│   │   ├── Landing/      # Landing page components
│   │   ├── Layout/       # Layout components
│   │   ├── Profile/      # User profile components
│   │   ├── Suggestions/  # Outfit suggestions
│   │   ├── TryOn/        # Virtual try-on
│   │   ├── Wardrobe/     # Wardrobe management
│   │   ├── demo/         # Demo components
│   │   └── ui/           # Reusable UI components
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # External library configurations
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── dist/                 # Build output
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript check
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage

# Security
npm run security:audit   # Audit dependencies
npm run security:fix     # Fix vulnerabilities

# Utilities
npm run clean            # Clean build artifacts
npm run demo:prep        # Prepare demo assets
```

## Features Implementation

### Authentication
Uses Supabase for user authentication. See `src/contexts/AuthContext.tsx`.

### Routing
React Router v7 with protected routes. See `src/App.tsx`.

### API Integration
Axios for backend communication. Base URL configured via environment variables.

### Styling
Tailwind CSS with custom configuration. See `tailwind.config.js`.

### Animations
Framer Motion for smooth transitions and animations.

## Development

### Component Guidelines

1. Use functional components with TypeScript
2. Keep components small and focused
3. Use custom hooks for shared logic
4. Follow the existing folder structure

### Code Style

- ESLint and Prettier are configured
- Run `npm run lint:fix` and `npm run format` before committing
- TypeScript strict mode is enabled

### Adding New Features

1. Create components in appropriate folder
2. Add routes in `App.tsx`
3. Update types in `src/types/`
4. Add utility functions in `src/utils/`

## Deployment

See the root `deploy.sh` script for automated deployment.

## Performance Optimization

- Code splitting with React.lazy
- Image optimization with custom components
- Prefetching for smoother navigation
- Memoization for expensive computations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### Common Issues

1. **Port 5173 already in use**: Change port in `vite.config.ts`
2. **API connection errors**: Verify `VITE_API_URL` in `.env.local`
3. **Supabase errors**: Check Supabase credentials
4. **Build errors**: Clear `node_modules` and reinstall

## License

MIT
