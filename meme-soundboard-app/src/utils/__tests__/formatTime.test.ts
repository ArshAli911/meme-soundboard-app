import { formatTime } from '../formatTime';

describe('formatTime', () => {
  it('formats seconds correctly to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(61)).toBe('01:01');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00'); // Or however you expect hours to be handled
  });

  it('handles single-digit minutes and seconds with leading zeros', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });

  it('handles larger values correctly', () => {
    expect(formatTime(3661)).toBe('61:01'); // 1 hour, 1 minute, 1 second
    expect(formatTime(7200)).toBe('120:00'); // 2 hours
  });
});