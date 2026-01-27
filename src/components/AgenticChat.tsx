import React, { useState, useRef, useEffect, useCallback } from 'react';
import ItineraryCard from '@/components/agentic/ItineraryCard';
import SuggestionCard from '@/components/agentic/SuggestionCard';
import ErrorCard from '@/components/agentic/ErrorCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { agenticOrchestrator, AgenticState } from '@/lib/agentic/orchestrator';
import { TravelIntent } from '@/lib/agentic/ai-gateway';
import { languageDetector } from '@/lib/agentic/language-detector';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/lib/analytics';

interface MessageMetadata {
  languageContext?: {
    detectedLanguage: string;
    responseLanguage: string;
  };
}

interface ItineraryMetadata {
  id: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  days: Array<{
    dayNumber: number;
    date: string;
    activities: Array<{
      activity: {
        id: string;
        name: string;
        description: string;
        category: string;
        duration: number;
        price: { adult: number; child: number; currency: string };
        location: { city: string; area: string };
        rating: number;
      };
      startTime: string;
      endTime: string;
      estimatedCost: number;
    }>;
    totalCost: number;
    totalDuration: number;
  }>;
  totalCost: number;
  summary: {
    activities: number;
    freeActivities: number;
    paidActivities: number;
  };
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type?: 'text' | 'itinerary' | 'suggestion' | 'error';
  metadata?: MessageMetadata | ItineraryMetadata;
}

const AgenticChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'السلام علیکم! میں آپ کا UAE ٹریول پلانر AI ہوں۔ مجھے اردو یا انگریزی میں بات کریں، میں اسی زبان میں جواب دوں گا۔',
      sender: 'agent',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentState, setCurrentState] = useState<Partial<AgenticState>>({});
  const [showProgress, setShowProgress] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const analytics = useAnalytics();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'understanding': return <Bot className="w-4 h-4" />;
      case 'researching': return <MapPin className="w-4 h-4" />;
      case 'planning': return <Calendar className="w-4 h-4" />;
      case 'finalizing': return <CheckCircle className="w-4 h-4" />;
      case 'complete': return <Sparkles className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStepProgress = (step: string): number => {
    const steps = ['understanding', 'researching', 'planning', 'finalizing', 'complete'];
    const index = steps.indexOf(step);
    return step === 'complete' ? 100 : ((index + 1) / steps.length) * 100;
  };

  const formatMessage = (message: string): string => {
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return message.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    // Detect language first
    const languageContext = languageDetector.detectLanguage(input);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      metadata: { languageContext }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setShowProgress(true);

    analytics.trackClick('agentic_chat_message', 'user_input');

    try {
      // Add language-aware thinking message
      const thinkingMessage: Message = {
        id: Date.now().toString() + '_thinking',
        content: languageContext.responseLanguage === 'urdu' 
          ? 'آپ کے سفر کا منصوبہ بنایا جا رہا ہے...' 
          : 'Planning your trip...',
        sender: 'agent',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, thinkingMessage]);

      // Process with agentic orchestrator
      const result = await agenticOrchestrator.processUserMessage(input, currentState);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));

      // Update state
      setCurrentState(result);

      // Add step-by-step messages based on processing
      const agentMessages: Message[] = [];

      if (result.currentStep === 'complete' && result.itinerary) {
        agentMessages.push({
          id: Date.now().toString() + '_intent',
          content: languageContext.responseLanguage === 'urdu' 
            ? `سمجھ گیا! آپ ${result.intent?.city} جا رہے ہیں۔`
            : `Got it! You're going to ${result.intent?.city}.`,
          sender: 'agent',
          timestamp: new Date(),
          type: 'text'
        });

        agentMessages.push({
          id: Date.now().toString() + '_itinerary',
          content: languageContext.responseLanguage === 'urdu' 
            ? 'آپ کا مکمل ٹریول پلان تیار ہو گیا ہے!'
            : 'Your complete travel plan is ready!',
          sender: 'agent',
          timestamp: new Date(),
          type: 'itinerary',
          metadata: result.itinerary
        });

        if (result.suggestions && result.suggestions.length > 0) {
          agentMessages.push({
            id: Date.now().toString() + '_suggestions',
            content: result.suggestions.join('\n\n'),
            sender: 'agent',
            timestamp: new Date(),
            type: 'suggestion'
          });
        }
      } else if (result.errors.length > 0) {
        agentMessages.push({
          id: Date.now().toString() + '_error',
          content: languageContext.responseLanguage === 'urdu' 
            ? `معذرت، کچھ مسائل آئے:\n${result.errors.join('\n')}`
            : `Sorry, there were some issues:\n${result.errors.join('\n')}`,
          sender: 'agent',
          timestamp: new Date(),
          type: 'error'
        });
      }

      setMessages(prev => [...prev, ...agentMessages]);

    } catch (error) {
      console.error('Agentic processing error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        content: languageContext.responseLanguage === 'urdu' 
          ? 'معذرت، میں آپ کا پیغام سمجھ نہیں سکا۔ براہ کرم دوبارہ کوشش کریں۔'
          : 'Sorry, I couldn\'t understand your message. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setShowProgress(false);
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleViewFullItinerary = useCallback((itinerary: ItineraryMetadata) => {
    localStorage.setItem('uae-tour-planner-v1', JSON.stringify(itinerary));
    navigate('/itinerary');
    analytics.trackFeature('agentic_itinerary_view', 'complete');
  }, [navigate, analytics]);

  const renderMessage = useCallback((message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </div>
          
          <Card className={`flex-1 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
            <CardContent className="p-3">
              {message.type === 'itinerary' && message.metadata ? (
                <ItineraryCard 
                  itinerary={message.metadata as ItineraryMetadata} 
                  onViewFullItinerary={() => handleViewFullItinerary(message.metadata as ItineraryMetadata)}
                />
              ) : message.type === 'suggestion' ? (
                <SuggestionCard content={message.content} />
              ) : message.type === 'error' ? (
                <ErrorCard content={message.content} />
              ) : (
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              )}
              
              <div className={`text-xs mt-2 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {message.timestamp.toLocaleTimeString('ur-PK', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }, [handleViewFullItinerary]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Travel Planner - آپ کا ذہنی ٹریول ایجنٹ
        </CardTitle>
        <p className="text-blue-100 text-sm">
          مجھے اپنا سفر بتائیں، میں بقیہ سب کچھ سمجھ جاؤں گا
        </p>
      </CardHeader>

      {/* Progress Bar */}
      {showProgress && currentState.currentStep && (
        <div className="px-4 py-2 bg-secondary/50 border-b">
          <div className="flex items-center gap-3">
            {getStepIcon(currentState.currentStep)}
            <span className="text-sm font-medium capitalize">
              {currentState.currentStep === 'understanding' && 'آپ کا مقصد سمجھا جا رہا ہے'}
              {currentState.currentStep === 'researching' && 'معلومات جمع کی جا رہی ہیں'}
              {currentState.currentStep === 'planning' && 'منصوبہ بنایا جا رہا ہے'}
              {currentState.currentStep === 'finalizing' && 'پلان مکمل کیا جا رہا ہے'}
              {currentState.currentStep === 'complete' && 'مکمل!'}
            </span>
            <Progress value={getStepProgress(currentState.currentStep)} className="flex-1" />
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
          {isProcessing && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <Card className="bg-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-4 border-t bg-secondary/30">
        <div className="flex gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary" onClick={() => setInput('میں دبئی اگلے ہفتے جانا چاہتا ہوں')}>
            دبئی اگلے ہفتے
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary" onClick={() => setInput('فیملی ٹریپ پلان کریں - 2 بالغ، 2 بچے')}>
            فیملی ٹریپ
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary" onClick={() => setInput('بجٹ 5000 درہم میں دبئی گائیڈ')}>
            بجٹ 5000 درہم
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary" onClick={() => setInput('ابو ظہبی میں کیا کرنا چاہیے؟')}>
            ابو ظہبی گائیڈ
          </Badge>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اپنا سفر کے بارے میں بتائیں... (اردو/English)"
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgenticChat;
