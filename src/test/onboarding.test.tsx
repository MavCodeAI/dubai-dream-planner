import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Onboarding from '../pages/Onboarding';

// Mock dependencies
const mockNavigate = vi.fn();
const mockSaveOnboardingData = vi.fn();
const mockSaveCurrentTrip = vi.fn();
const mockGetOnboardingData = vi.fn();
const mockGenerateItinerary = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('../lib/storage', () => ({
  saveOnboardingData: mockSaveOnboardingData,
  saveCurrentTrip: mockSaveCurrentTrip,
  getOnboardingData: mockGetOnboardingData
}));

vi.mock('../lib/itinerary-generator', () => ({
  generateItinerary: mockGenerateItinerary
}));

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess
  }
}));

describe('Onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOnboardingData.mockReturnValue(null);
    mockGenerateItinerary.mockReturnValue({
      id: 'test-trip',
      name: 'Test Trip',
      days: []
    });
  });

  it('renders onboarding page', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    expect(screen.getByText(/Plan your UAE trip/i)).toBeInTheDocument();
  });

  it('shows step indicator', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    expect(screen.getByText(/Cities/i)).toBeInTheDocument();
  });

  it('shows 5 steps in total', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    expect(screen.getByText(/Dates/i)).toBeInTheDocument();
    expect(screen.getByText(/Travelers/i)).toBeInTheDocument();
    expect(screen.getByText(/Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Interests/i)).toBeInTheDocument();
  });

  it('shows back button disabled on first step', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('enables next button when cities are selected', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to dates step after selecting city', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText(/When are you traveling/i)).toBeInTheDocument();
  });

  it('enables back button on second step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).not.toBeDisabled();
  });

  it('navigates back to previous step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Go to step 2
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(screen.getByText(/Dubai/i)).toBeInTheDocument();
  });

  it('shows trip type options on travelers step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 3
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    const nextButton1 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton1);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    const nextButton2 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton2);

    expect(screen.getByText(/Solo/i)).toBeInTheDocument();
    expect(screen.getByText(/Couple/i)).toBeInTheDocument();
    expect(screen.getByText(/Family/i)).toBeInTheDocument();
    expect(screen.getByText(/Group/i)).toBeInTheDocument();
  });

  it('updates traveler count when trip type changes', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 3
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    const nextButton1 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton1);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    const nextButton2 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton2);

    // Select Family trip type
    const familyOption = screen.getByText(/Family/i);
    fireEvent.click(familyOption);

    expect(screen.getByDisplayValue(/2/i)).toBeInTheDocument(); // Adults
    expect(screen.getByDisplayValue(/1/i)).toBeInTheDocument(); // Children
  });

  it('shows budget slider on budget step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 4
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    const nextButton1 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton1);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    const nextButton2 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton2);

    expect(screen.getByText(/What's your budget/i)).toBeInTheDocument();
  });

  it('shows interest options on interests step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 5
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    const nextButton1 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton1);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    const nextButton2 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton2);

    const soloOption = screen.getByText(/Solo/i);
    fireEvent.click(soloOption);

    const nextButton3 = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton3);

    expect(screen.getByText(/Beach & Relaxation/i)).toBeInTheDocument();
    expect(screen.getByText(/Culture & Heritage/i)).toBeInTheDocument();
    expect(screen.getByText(/Adventure & Thrills/i)).toBeInTheDocument();
  });

  it('generates itinerary on final step', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Complete all steps
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    
    let nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const soloOption = screen.getByText(/Solo/i);
    fireEvent.click(soloOption);

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const generateButton = screen.getByRole('button', { name: /Generate Itinerary/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockSaveOnboardingData).toHaveBeenCalled();
      expect(mockSaveCurrentTrip).toHaveBeenCalled();
    });
  });

  it('disables next button when no cities selected', () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('disables generate button when no interests selected', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 5
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    
    let nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const soloOption = screen.getByText(/Solo/i);
    fireEvent.click(soloOption);

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const generateButton = screen.getByRole('button', { name: /Generate Itinerary/i });
    expect(generateButton).toBeDisabled();
  });

  it('toggles interest selection', async () => {
    render(
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    );

    // Navigate to step 5
    const dubaiOption = screen.getByText(/Dubai/i);
    fireEvent.click(dubaiOption);
    
    let nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-03-07' } });

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const soloOption = screen.getByText(/Solo/i);
    fireEvent.click(soloOption);

    nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    const beachOption = screen.getByText(/Beach & Relaxation/i);
    fireEvent.click(beachOption);

    const generateButton = screen.getByRole('button', { name: /Generate Itinerary/i });
    expect(generateButton).not.toBeDisabled();
  });
});
