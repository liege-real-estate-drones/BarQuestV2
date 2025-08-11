import { Actor } from './actor.js';
import { Combat } from './combat.js';
import { DataLoader, GameData } from './dataLoader.js';
import { CombatLog } from './combatLog.js';
import { CombatEvent } from './types.js';

async function main() {
  // 1. Setup
  console.log('Loading data...');
  const combatLog = new CombatLog();
  const dataLoader = new DataLoader();
  await dataLoader.load('./data/sample/');
  const data: GameData = dataLoader.data;

  // Let's grab the first class and first monster for our simulation
  const playerClass = Object.values(data.classes)[0];
  const monsterData = Object.values(data.monstres)[0];

  console.log(`Creating actors: ${playerClass.nom} vs ${monsterData.nom}`);
  const player = new Actor(playerClass.nom, playerClass.statsBase, 10);
  const monster = new Actor(monsterData.nom, monsterData.stats, 10);

  // 2. Initialize Combat
  // We'll use a fixed seed for reproducible results
  const combat = new Combat(player, monster, 12345); 

  console.log('\n--- Combat Start ---');
  console.log(`${player.name} (Lvl ${player.level}) HP: ${player.hp}`);
  console.log(`${monster.name} (Lvl ${monster.level}) HP: ${monster.hp}`);
  
  // 3. Main combat loop
  // We'll simulate time passing by calling tick repeatedly.
  const deltaTime = 0.1; // Simulate 100ms ticks
  let simulationTime = 0;
  const maxSimulationTime = 60; // Safety break after 60 seconds of simulated time

  while (!combat.isFinished && simulationTime < maxSimulationTime) {
    combat.tick(deltaTime);
    simulationTime += deltaTime;
  }
  
  // 4. Display Results
  console.log('\n--- Combat End ---');

  if (!combat.isFinished) {
    console.log("Combat timed out!");
  }

  if (player.isAlive()) {
    console.log(`${player.name} wins! Remaining HP: ${player.hp}`);
  } else {
    console.log(`${monster.name} wins! Remaining HP: ${monster.hp}`);
  }

  // Display logs from the event bus
  console.log('\n--- Combat Log ---');
  const events: CombatEvent[] = combatLog.getEvents();
  events.forEach((event: CombatEvent) => {
    // The 'note' property contains a human-readable summary of the event
    if(event.note) {
      console.log(`[t:${event.t.toFixed(0)}] ${event.note}`);
    }
  });

  // Important for cleanup if the app were to continue running
  combatLog.stop();
}

main().catch(error => {
  console.error("An error occurred during the simulation:", error);
});
