describe('logger', () => {
  const originalConsole = console;

  beforeEach(() => {
    // Mock all console methods to prevent actual console output during tests
    global.console = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(), // Mocking log as well for completeness if used directly
    } as unknown as Console;
  });

  afterEach(() => {
    // Restore original console methods after each test
    global.console = originalConsole;
  });

  it('logs info messages correctly', () => {
    const { logger } = require('../logger');
    const message = 'Test info message';
    logger.info(message);
    const expectedMessage = expect.stringContaining(`] [INFO] ${message}`);
    expect(console.log).toHaveBeenCalledWith(expectedMessage);
  });

  it('logs warn messages correctly', () => {
    const { logger } = require('../logger');
    const message = 'Test warn message';
    logger.warn(message);
    const expectedMessage = expect.stringContaining(`] [WARN] ${message}`);
    expect(console.warn).toHaveBeenCalledWith(expectedMessage);
  });

  it('logs error messages correctly', () => {
    const { logger } = require('../logger');
    const message = 'Test error message';
    logger.error(message);
    const expectedMessage = expect.stringContaining(`] [ERROR] ${message}`);
    expect(console.error).toHaveBeenCalledWith(expectedMessage);
  });

  it('logs debug messages correctly', () => {
    const { logger } = require('../logger');
    const message = 'Test debug message';
    logger.debug(message);
    const expectedMessage = expect.stringContaining(`] [DEBUG] ${message}`);
    expect(console.debug).toHaveBeenCalledWith(expectedMessage);
  });

  it('logs messages with additional arguments', () => {
    const { logger } = require('../logger');
    const message = 'Message with args';
    const arg1 = { key: 'value' };
    const arg2 = [1, 2, 3];
    logger.info(message, arg1, arg2);
    const expectedMessage = expect.stringContaining(`] [INFO] ${message} ${JSON.stringify([arg1, arg2])}`);
    expect(console.log).toHaveBeenCalledWith(expectedMessage);
  });
}); 