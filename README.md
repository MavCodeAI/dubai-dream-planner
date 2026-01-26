# Dubai Dream Planner

An AI-powered travel planning application for Dubai and the UAE. Create personalized itineraries, get activity recommendations, and optimize your travel budget with intelligent AI agents.

## Features

- **AI-Powered Planning**: Intelligent itinerary generation using advanced AI agents
- **Multi-Language Support**: Plan your trip in your preferred language
- **Weather-Aware Recommendations**: Get activity suggestions based on weather conditions
- **Budget Optimization**: Smart budget analysis and cost optimization
- **Personalized Activities**: Curated activity recommendations based on your interests
- **Interactive Itinerary**: Visual timeline of your daily activities

## Architecture

The application uses an agentic AI architecture with specialized agents:

- **Planning Agent**: Generates and optimizes travel itineraries
- **Activity Agent**: Manages activity recommendations and bookings
- **Weather Agent**: Handles weather information and recommendations
- **Budget Agent**: Analyzes and optimizes travel budgets
- **Orchestrator**: Coordinates all agents and manages conversation flow

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Hooks, Local Storage
- **AI Integration**: LongCat AI Gateway, Custom AI Client
- **Testing**: Vitest, React Testing Library
- **Documentation**: TypeDoc

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENWEATHER_API_KEY=your-openweather-api-key
VITE_LONGCAT_API_KEY=your-longcat-api-key
```

## Project Structure

```
src/
├── components/          # React components
│   ├── agentic/        # AI-related components
│   ├── onboarding/     # Onboarding wizard components
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── agentic/        # AI agents and orchestration
│   │   ├── agents/     # Specialized agents
│   │   ├── ai-gateway.ts
│   │   ├── longcat-client.ts
│   │   └── orchestrator.ts
│   ├── ai-client.ts
│   ├── error-handling.ts
│   └── storage.ts
├── pages/              # Route pages
├── types/              # TypeScript type definitions
└── test/               # Unit and component tests
```

## Key Features

### AI Planning

The AI planning system uses multiple specialized agents to create optimal travel experiences:

```typescript
import { orchestrator } from './lib/agentic/orchestrator';

const itinerary = await orchestrator.createItinerary({
  city: 'dubai',
  dates: { start: '2024-03-01', end: '2024-03-07' },
  travelers: { adults: 2, children: 0 },
  budget: { amount: 5000, currency: 'AED' },
  interests: ['culture', 'adventure']
});
```

### Multi-Language Support

The application supports multiple languages for travel planning:

```typescript
import { languageDetector } from './lib/agentic/language-detector';

const detectedLang = await languageDetector.detect('أريد زيارة دبي');
// Returns: 'ar'
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- weather-agent.test.ts
```

## Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy

```bash
# Deploy using Vercel CLI
npx vercel deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

## Documentation

Generate API documentation:

```bash
npm run docs
```

Documentation will be available in the `docs/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details
