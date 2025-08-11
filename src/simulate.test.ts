import { describe, it, expect } from 'vitest';
import { DataLoader } from './dataLoader';
import { Actor } from './actor';
import { Combat } from './combat';
import { CombatLog } from './combatLog';
import { CombatEvent } from './types';
import fs from 'fs/promises';

// This test file is a workaround to execute the main simulation logic
// and capture its output to a file, since the build environment is unreliable.

describe('Combat Simulator Runner', () => {

  // This array will collect all log lines.
  const outputLog: string[] = [];

  /**
   * A helper to add lines to our log collector instead of console.log.
   * @param message The message to log.
   */
  const captureLog = (message: string) => {
    outputLog.push(message);
  };

  const runSimulation = async (seed: number) => {
    captureLog(`\n--- Starting Combat Simulation (Seed: ${seed}) ---`);
    const loader = new DataLoader();
    await loader.load('data/sample');
    const gameData = loader.data;
    const playerData = gameData.classes['war'];
    const monsterData = gameData.monstres['boar'];
    const player = new Actor(playerData.nom, playerData.statsBase, 1);
    const monster = new Actor(monsterData.nom, monsterData.stats, monsterData.niveau);
    const combatLog = new CombatLog();
    const combat = new Combat(player, monster, seed);

    let totalTicks = 0;
    while (!combat.isFinished && totalTicks < 2000) {
      combat.tick(0.05);
      totalTicks++;
    }

    captureLog(`Combat finished after ${(totalTicks * 0.05).toFixed(2)} seconds.`);
    if (player.isAlive()) {
      captureLog(`🏆 Winner: ${player.name} (HP: ${player.hp}/${player.currentStats.PV})`);
    } else {
      captureLog(`🏆 Winner: ${monster.name} (HP: ${monster.hp}/${monster.currentStats.PV})`);
    }

    captureLog('\n--- Combat Log ---');
    combatLog.getEvents().forEach(logEvent);
    combatLog.stop();
  };

  const logEvent = (event: CombatEvent) => {
      const time = `[T+${event.t.toFixed(0)}ms]`.padEnd(12);
      let message = '';
      if (event.note) {
          message = event.note;
          if (event.type === 'crit') {
              message = `💥 CRITICAL! ${message}`;
          }
      } else {
          message = `Event: ${event.type}, Value: ${event.value || 'N/A'}`;
      }
      captureLog(`${time} ${message}`);
  };

  it('should run the full combat simulation and write the logs to a file', async () => {
    captureLog('====================================');
    captureLog('  Running BarQuest Combat Simulator ');
    captureLog('====================================');

    await runSimulation(42);
    await runSimulation(1337);
    await runSimulation(9001);

    captureLog('\n...All simulations complete.');

    // Write the collected logs to a file in the root directory.
    await fs.writeFile('simulation-log.txt', outputLog.join('\n'));

    // The test's purpose is to generate the log file, so we just assert true.
    expect(true).toBe(true);
  }, 30000); // Increased timeout for the test as it runs multiple simulations and writes a file.
});
