# LongCat API Integration Guide

This document explains how the LongCat API Platform has been integrated into the Dubai Dream Planner project to provide enhanced AI capabilities.

## Overview

The LongCat API Platform provides high-performance AI models with generous free quotas and is now the primary AI provider for the Dubai Dream Planner. The integration includes:

- **Primary AI Provider**: LongCat API with fallback to Lovable AI
- **Rate Limiting**: Intelligent rate limiting to respect API limits
- **Error Handling**: Comprehensive error handling with retry logic
- **Enhanced Features**: AI-powered travel planning, weather analysis, and activity recommendations

## Setup

### 1. Get LongCat API Key

1. Visit [LongCat API Platform](https://api.longcat.chat)
2. Register an account
3. Go to API Keys page and create a new API key
4. Copy the API key for configuration

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# LongCat API Platform (Primary AI Provider)
VITE_LONGCAT_API_KEY=your_longcat_api_key_here

# AI Gateway (Lovable AI - Fallback)
VITE_LOVABLE_API_KEY=your_lovable_api_key_here

# Weather API (OpenWeatherMap)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 3. Available Models

LongCat API supports these models:

- `LongCat-Flash-Chat` - High-performance general-purpose chat model (default)
- `LongCat-Flash-Thinking` - Deep-thinking model
- `LongCat-Flash-Thinking-2601` - Upgraded Deep Thinking Model

## Features

### 1. Multi-Provider AI Gateway

The AI Gateway automatically manages multiple AI providers with intelligent fallback:

```typescript
import { aiGateway } from './src/lib/agentic/ai-gateway';

// Primary provider: LongCat API
// Fallback provider: Lovable AI
const response = await aiGateway.callLLM("Hello, help me plan a trip to Dubai");
```

### 2. Enhanced Travel Intent Extraction

AI-powered extraction of travel details from user input in Urdu/English:

```typescript
const intent = await aiGateway.extractTravelIntent(
  "میں دبئی جانا چاہتا ہوں اگلے ہفتے، 2 بالغ، 1 بچہ، $3000 بجٹ"
);
```

### 3. Intelligent Itinerary Planning

AI-generated personalized itineraries considering:

- Weather conditions
- User interests
- Budget constraints
- Family-friendly options
- Cultural considerations

### 4. Weather Impact Analysis

AI analysis of how weather affects outdoor activities:

```typescript
const analyzedActivities = await weatherAgent.analyzeWeatherImpact(
  activities, 
  weatherForecast
);
```

### 5. Activity Recommendations

AI-powered activity recommendations based on:

- User preferences
- Weather conditions
- Budget constraints
- Location context

## API Usage and Limits

### LongCat API Quotas

- **Daily Free Quota**: 500,000 tokens per day
- **Refresh Time**: Midnight (Beijing Time)
- **Output Limit**: Maximum 8K tokens per request
- **Rate Limiting**: Built-in rate limiting to prevent exceeding limits

### Rate Limiting

The client includes intelligent rate limiting:

- **Window**: 1 minute
- **Max Requests**: 100 requests per minute
- **Retry Logic**: Exponential backoff with jitter
- **Automatic Recovery**: Handles rate limit errors gracefully

## Error Handling

### Automatic Fallback

If LongCat API is unavailable, the system automatically falls back to Lovable AI:

```typescript
// This will try LongCat first, then fallback to Lovable if needed
const response = await aiGateway.extractTravelIntent(userInput);
```

### Retry Logic

- **Max Retries**: 3 attempts
- **Backoff Strategy**: Exponential backoff
- **Rate Limit Handling**: Respects API retry-after headers
- **Server Errors**: Retries on 5xx errors

## Monitoring and Status

### Provider Status

Check which AI provider is being used:

```typescript
const status = aiGateway.getProviderStatus();
console.log(status);
// { provider: 'longcat', available: true, fallback: true }
```

### Usage Statistics

Monitor API usage and rate limits:

```typescript
const stats = longCatClient.getUsageStats();
console.log(stats);
// { provider: 'LongCat API Platform', model: 'LongCat-Flash-Chat', rateLimit: {...}, configured: true }
```

### Rate Limit Status

Check current rate limit status:

```typescript
const rateLimit = longCatClient.getRateLimitStatus();
console.log(rateLimit);
// { requestsInWindow: 15, maxRequests: 100, resetTime: 1640995200000, timeUntilReset: 45000 }
```

## Architecture

### File Structure

```
src/lib/agentic/
├── ai-gateway.ts          # Multi-provider AI gateway
├── longcat-client.ts       # LongCat API client with rate limiting
└── agents/
    ├── weather-agent.ts    # Enhanced with AI weather analysis
    ├── activity-agent.ts   # Enhanced with AI activity planning
    ├── budget-agent.ts     # Budget planning agent
    └── planning-agent.ts   # Trip planning agent
```

### Key Components

1. **LongCatClient**: Direct LongCat API integration with rate limiting
2. **AIGateway**: Multi-provider management with fallback logic
3. **Enhanced Agents**: Existing agents upgraded with AI capabilities

## Best Practices

### 1. Error Handling

Always wrap AI calls in try-catch blocks:

```typescript
try {
  const intent = await aiGateway.extractTravelIntent(userInput);
  // Process intent
} catch (error) {
  console.error('AI processing failed:', error);
  // Handle gracefully with fallback
}
```

### 2. Rate Limit Awareness

The system handles rate limiting automatically, but be mindful of:

- High-frequency operations
- Batch processing
- Concurrent requests

### 3. Token Usage

- Keep prompts concise
- Use appropriate max_tokens limits
- Monitor daily quota usage

### 4. Fallback Planning

- Always have fallback logic
- Provide meaningful error messages
- Graceful degradation when AI is unavailable

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```
   Error: LongCat API key not configured
   ```
   Solution: Set `VITE_LONGCAT_API_KEY` environment variable

2. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded. Please wait 45 seconds.
   ```
   Solution: Built-in retry logic handles this automatically

3. **Provider Unavailable**
   ```
   Error: All AI providers failed
   ```
   Solution: Check API keys and network connectivity

### Debug Mode

Enable debug logging:

```typescript
// In development, check console for detailed logs
console.log('AI Provider Status:', aiGateway.getProviderStatus());
console.log('Rate Limit Status:', longCatClient.getRateLimitStatus());
```

## Future Enhancements

### Planned Features

1. **Streaming Responses**: Real-time AI responses
2. **Model Selection**: Dynamic model selection based on task complexity
3. **Usage Analytics**: Detailed usage tracking and analytics
4. **Caching**: Intelligent response caching for common queries
5. **Multi-language Support**: Enhanced support for Arabic and Urdu

### Performance Optimizations

1. **Request Batching**: Batch multiple AI requests
2. **Connection Pooling**: Reuse HTTP connections
3. **Response Compression**: Optimize response sizes
4. **Edge Caching**: Cache responses at edge locations

## Support

For issues related to:

- **LongCat API**: Contact longcat-team@meituan.com
- **Integration**: Check GitHub issues or create new ones
- **Documentation**: Update this README as needed

## License

This integration follows the same license as the Dubai Dream Planner project.
