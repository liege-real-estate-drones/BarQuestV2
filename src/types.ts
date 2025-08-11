/**
 * This file contains the core TypeScript types for the BarQuest game model,
 * as specified in the project brief. These types define the structure of
 * all game data, from character stats to items and combat events.
 */

// Defines the rarity levels for items, which can affect their stats and appearance.
export type Rareté = "Commun" | "Rare" | "Épique" | "Légendaire";

/**
 * Represents the set of core statistics for any actor in the game (players or monsters).
 */
export interface Stats {
  PV: number; // Points de Vie (Health Points)
  RessourceMax?: number; // Max value for Mana, Energy, Rage, etc.
  AttMin: number; // Minimum attack damage
  AttMax: number; // Maximum attack damage
  CritPct: number; // Critical hit chance (e.g., 0.05 for 5%)
  CritDmg: number; // Critical hit damage multiplier (e.g., 1.5 for 150%)
  Armure: number; // Armor value, used for damage reduction
  ResElems?: Record<string, number>; // Elemental resistances (e.g., { feu: 10, glace: 5 })
  Vitesse: number; // Attack speed or action speed
  Precision: number; // Hit chance rating
  Esquive: number; // Dodge chance rating
}

/**
 * Defines a player character class.
 */
export interface Classe {
  id: string;
  nom: string;
  ressource: "Mana" | "Énergie" | "Rage";
  archétype: "Mêlée" | "Distance" | "Magie" | "Soutien";
  statsBase: Stats;
}

/**
 * Defines a talent or skill that a player can learn.
 */
export interface Talent {
  id: string;
  nom: string;
  rangMax: number; // Maximum rank for this talent
  effets: {
    stat: keyof Stats | string; // The stat affected (or a custom effect ID)
    parRang: number; // The amount of bonus per rank
  }[];
  exigences: {
    classeId?: string; // Optional class requirement
    prerequis: string[]; // IDs of other talents required
  };
}

/**
 * Defines an affix that can appear on an item.
 */
export interface Affixe {
  id: string;
  type: "prefix" | "suffix";
  portée: [number, number]; // Range of values the affix can roll [min, max]
  échelonnage: "lin" | "exp" | "palier"; // Scaling type: linear, exponential, or by tier
}

/**
 * Defines an item that can be equipped or used.
 */
export interface Objet {
  id: string;
  slot: string; // e.g., "Main", "Tête", "Torse"
  rareté: Rareté;
  niveauMin: number;
  affixes: {
    ref: string; // ID of the affix from the affixes table
    type: "prefix" | "suffix";
    val?: number; // The rolled value for the affix, if not calculated at runtime
  }[];
  tagsClasse?: string[]; // Optional tags to restrict item to certain classes
}

/**
 * Defines a specific monster ability or skill.
 */
export interface Compétence {
  id: string;
  nom: string;
  mult?: number; // Damage multiplier
  cd?: number; // Cooldown in seconds
}

/**
 * Defines a monster in the game.
 */
export interface Monstre {
  id: string;
  nom: string;
  famille: string; // e.g., "bête", "mort-vivant"
  niveau: number;
  stats: Stats;
  compétences: Compétence[];
  lootTableId: string; // ID of the loot table to use on death
}

/**
 * Defines a dungeon or area.
 */
export interface Donjon {
  id:string;
  palier: number; // Tier of the dungeon
  modificateurs: string[]; // IDs of active modifiers (e.g., "plus_de_vie", "monstres_rapides")
  poidsMod: number; // Weight for modifier rolls
  bossId?: string | null; // ID of the boss for this dungeon
  tablesLoot: string[]; // IDs of loot tables active in this dungeon
}

/**
 * Defines a single entry in a loot table.
 */
export interface DropTableEntry {
  ref: string; // ID of the item, currency, or set
  type: "objet" | "currency" | "set";
  poids: number; // Weight for the drop chance calculation
  qty: [number, number]; // Quantity range [min, max]
}

/**
 * Defines a loot table, which contains a list of possible drops.
 */
export interface DropTable {
  id: string;
  entrées: DropTableEntry[];
}

/**
 * Defines the core balancing formulas and parameters for the game.
 */
export interface Equilibrage {
  formules: {
    TTNH: string; // Time To Next Hit formula
    Degats: string; // Damage calculation formula
    ReducArmure: string; // Armor reduction formula
    HitChance: string; // Hit chance formula
  };
  params: {
    BaseDelay: number;
    k: number; // A constant for the armor formula
    hitSlope?: number; // A parameter for the hit chance sigmoid
  };
}

/**
 * Represents a single event in the combat log.
 * This is used to communicate what happened during a fight to the UI.
 */
export interface CombatEvent {
  t: number; // Timestamp in milliseconds relative to combat start
  type: "hit" | "crit" | "miss" | "dodge" | "buff" | "debuff" | "drop" | "state";
  src?: string; // Source actor ID
  dst?: string; // Destination actor ID
  value?: number; // e.g., damage amount, heal amount
  note?: string; // e.g., skill name, item name
}
