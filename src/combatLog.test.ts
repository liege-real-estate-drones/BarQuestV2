import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CombatLog } from './combatLog';
import { gameEventBus } from './events';
import { CombatEvent } from './types';

describe('CombatLog', () => {
  let combatLog: CombatLog;

  beforeEach(() => {
    // Create a new logger for each test to ensure isolation.
    combatLog = new CombatLog();
  });

  // Ensure the logger stops listening after each test to not affect other tests.
  afterEach(() => {
    combatLog.stop();
  });

  it('should record events that are published on the gameEventBus', () => {
    const event1: CombatEvent = { t: 100, type: 'hit', value: 10 };
    const event2: CombatEvent = { t: 200, type: 'crit', value: 25 };

    // Manually publish events to the global bus.
    gameEventBus.publish('combat', event1);
    gameEventBus.publish('combat', event2);

    const recordedEvents = combatLog.getEvents();
    expect(recordedEvents.length).toBe(2);
    expect(recordedEvents[0]).toEqual(event1);
    expect(recordedEvents[1]).toEqual(event2);
  });

  it('should stop recording events after stop() is called', () => {
    const event1: CombatEvent = { t: 100, type: 'hit', value: 10 };
    gameEventBus.publish('combat', event1);

    combatLog.stop(); // Stop listening.

    const event2: CombatEvent = { t: 200, type: 'miss' };
    gameEventBus.publish('combat', event2); // This event should be ignored.

    const recordedEvents = combatLog.getEvents();
    expect(recordedEvents.length).toBe(1);
    expect(recordedEvents[0]).toEqual(event1);
  });

  it('should clear all recorded events when clear() is called', () => {
    const event1: CombatEvent = { t: 100, type: 'hit', value: 10 };
    gameEventBus.publish('combat', event1);

    expect(combatLog.getEvents().length).toBe(1);
    combatLog.clear();
    expect(combatLog.getEvents().length).toBe(0);
  });

  it('should be able to start listening again after being stopped', () => {
    combatLog.stop();
    const event1: CombatEvent = { t: 100, type: 'miss' };
    gameEventBus.publish('combat', event1); // Should not be recorded.

    combatLog.listen(); // Start listening again.
    const event2: CombatEvent = { t: 200, type: 'hit', value: 15 };
    gameEventBus.publish('combat', event2); // Should be recorded now.

    const recordedEvents = combatLog.getEvents();
    expect(recordedEvents.length).toBe(1);
    expect(recordedEvents[0]).toEqual(event2);
  });
});
