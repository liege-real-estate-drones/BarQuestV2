import { Actor } from './actor';
import { SeededRNG } from './seededRng';
import * as Formulas from './formulas';
import { gameEventBus } from './events';

/**
 * Represents the state of an actor within a single combat instance.
 */
interface CombatActor {
  actor: Actor;
  progress: number; // Progress to the next action, from 0.0 to 1.0
}

/**
 * Manages a combat encounter between two actors.
 * The combat is resolved through a tick-based system where each actor
 * acts when their progress bar fills up.
 */
export class Combat {
  private player: CombatActor;
  private monster: CombatActor;
  private rng: SeededRNG;
  private time: number = 0; // Total time elapsed in seconds

  public isFinished: boolean = false;

  // As per spec, this is a balancing parameter.
  // In a full implementation, this would come from the loaded Equilibrage data.
  private baseDelay: number = 1.6;

  constructor(player: Actor, monster: Actor, seed: number) {
    this.player = { actor: player, progress: 0 };
    this.monster = { actor: monster, progress: 0 };
    this.rng = new SeededRNG(seed);
  }

  /**
   * Advances the combat simulation by a small time step (deltaTime).
   * @param deltaTime The time elapsed since the last tick, in seconds.
   */
  public tick(deltaTime: number): void {
    if (this.isFinished) return;

    this.time += deltaTime;

    // Update status effects for both actors.
    this.player.actor.updateEffects(deltaTime);
    this.monster.actor.updateEffects(deltaTime);

    // Calculate Time To Next Hit for each actor based on their current stats.
    // We assume the 'Vitesse' stat represents Haste.
    const playerTTNH = Formulas.calculateTTNH(this.baseDelay, this.player.actor.currentStats.Vitesse);
    const monsterTTNH = Formulas.calculateTTNH(this.baseDelay, this.monster.actor.currentStats.Vitesse);

    this.player.progress += deltaTime / playerTTNH;
    this.monster.progress += deltaTime / monsterTTNH;

    // Check if the player can act.
    if (this.player.progress >= 1.0) {
      this.player.progress -= 1.0;
      this.performAttack(this.player.actor, this.monster.actor);
    }

    if (this.isFinished) return;

    // Check if the monster can act.
    if (this.monster.progress >= 1.0) {
      this.monster.progress -= 1.0;
      this.performAttack(this.monster.actor, this.player.actor);
    }
  }

  private performAttack(attacker: Actor, defender: Actor): void {
    const hitChance = Formulas.calculateHitChance(attacker.currentStats.Precision, defender.currentStats.Esquive);
    const roll = this.rng.next();

    if (roll > hitChance) {
        gameEventBus.publish('combat', {
            t: this.time * 1000,
            type: 'miss',
            src: attacker.id,
            dst: defender.id,
            note: `${attacker.name} missed ${defender.name}`
        });
        return;
    }

    const hit = Formulas.calculateHitDamage(this.rng, attacker.currentStats);
    const finalDamage = Formulas.calculateArmorReduction(hit.damage, defender.currentStats.Armure, attacker.level);
    const roundedDamage = Math.round(finalDamage);

    defender.takeDamage(roundedDamage);

    gameEventBus.publish('combat', {
        t: this.time * 1000,
        type: hit.isCrit ? 'crit' : 'hit',
        src: attacker.id,
        dst: defender.id,
        value: roundedDamage,
        note: `${attacker.name} ${hit.isCrit ? 'critically hits' : 'hits'} ${defender.name} for ${roundedDamage} damage.`
    });

    if (!defender.isAlive()) {
      this.isFinished = true;
      // Optional: could fire a 'combat-end' event here.
    }
  }
}
