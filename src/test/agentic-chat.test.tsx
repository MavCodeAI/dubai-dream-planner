import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AgenticChat from '../components/AgenticChat';

// Mock dependencies
const mockNavigate = vi.fn();
const mockProcessUserMessage = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('../lib/analytics', () => ({
  useAnalytics: () => ({
    trackClick: vi.fn(),
    trackFeature: vi.fn()
  })
}));

vi.mock('../lib/agentic/orchestrator', () => ({
  agenticOrchestrator: {
    processUserMessage: mockProcessUserMessage
  },
  AgenticState: {}
}));

vi.mock('../lib/agentic/language-detector', () => ({
  languageDetector: {
    detectLanguage: () => ({
      detectedLanguage: 'urdu',
      responseLanguage: 'urdu'
    })
  }
}));

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders initial welcome message', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    expect(screen.getByText(/AI Travel Planner/i)).toBeInTheDocument();
  });

  it('displays initial agent message in Urdu', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    expect(screen.getByText(/السلام علیکم/i)).toBeInTheDocument();
  });

  it('shows input field', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    expect(input).toBeInTheDocument();
  });

  it('shows send button', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    expect(sendButton).not.toBeDisabled();
  });

  it('adds user message to chat when sent', async () => {
    mockProcessUserMessage.mockResolvedValue({
      currentStep: 'complete',
      itinerary: null,
      suggestions: [],
      errors: []
    });

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'I want to visit Dubai' } });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(screen.getByText(/I want to visit Dubai/i)).toBeInTheDocument();
  });

  it('shows processing state while loading', async () => {
    mockProcessUserMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });

  it('disables input while processing', async () => {
    mockProcessUserMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows quick action badges', () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    expect(screen.getByText(/دبئی اگلے ہفتے/i)).toBeInTheDocument();
    expect(screen.getByText(/فیملی ٹریپ/i)).toBeInTheDocument();
    expect(screen.getByText(/بجٹ 5000 درہم/i)).toBeInTheDocument();
  });

  it('clicking quick action badge sets input value', async () => {
    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const quickAction = screen.getByText(/دبئی اگلے ہفتے/i);
    fireEvent.click(quickAction);

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    expect(input).toHaveValue();
  });

  it('handles enter key to send message', async () => {
    mockProcessUserMessage.mockResolvedValue({
      currentStep: 'complete',
      itinerary: null,
      suggestions: [],
      errors: []
    });

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Test message/i)).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    mockProcessUserMessage.mockRejectedValue(new Error('Test error'));

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(screen.getByText(/couldn't understand/i)).toBeInTheDocument();
  });

  it('shows progress bar during processing', async () => {
    mockProcessUserMessage.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <AgenticChat />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/اردو\/English/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
