import { trackEvent } from '../analytics';
// Explicitly mock the firebase/analytics module
jest.mock('firebase/analytics');
import { logEvent } from 'firebase/analytics';

describe('analytics', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  it('calls logEvent with correct parameters when params are provided', () => {
    const eventName = 'test_event';
    const params = { item_id: '123', item_name: 'Test Item' };
    trackEvent(eventName, params);
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), eventName, params);
  });

  it('calls logEvent with correct parameters when no params are provided', () => {
    const eventName = 'another_event';
    trackEvent(eventName);
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), eventName, undefined);
  });

  it('handles errors gracefully and logs a warning', () => {
    // Mock console.warn to check if it's called
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Simulate an error from logEvent
    (logEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Mock analytics error');
    });

    const eventName = 'error_event';
    trackEvent(eventName);

    // Expect logEvent to have been attempted
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), eventName, undefined);

    // Expect console.warn to have been called due to the error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Analytics tracking failed:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore(); // Restore original console.warn
  });
}); 