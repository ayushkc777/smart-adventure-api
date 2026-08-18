import { describe, expect, it, vi } from 'vitest';
import { createShutdownHandler } from '../../src/utils/shutdown.js';

describe('server shutdown lifecycle', () => {
  it('closes HTTP and database resources once across repeated signals', async () => {
    let finishClose;
    const server = {
      close: vi.fn((callback) => { finishClose = callback; }),
    };
    const disconnect = vi.fn(async () => {});
    const exit = vi.fn();
    const logger = { error: vi.fn(), info: vi.fn() };
    const shutdown = createShutdownHandler({ disconnect, exit, logger, server });

    const first = shutdown();
    const repeated = shutdown();
    expect(first).toBe(repeated);
    expect(server.close).toHaveBeenCalledOnce();

    finishClose();
    await first;

    expect(disconnect).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
    expect(logger.info).toHaveBeenCalledOnce();
  });

  it('exits unsuccessfully when resource cleanup fails', async () => {
    const server = { close: vi.fn((callback) => callback()) };
    const disconnect = vi.fn(async () => { throw new Error('database close failed'); });
    const exit = vi.fn();
    const logger = { error: vi.fn(), info: vi.fn() };
    const shutdown = createShutdownHandler({ disconnect, exit, logger, server });

    await shutdown();

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalledWith('Graceful shutdown failed: database close failed');
  });
});
