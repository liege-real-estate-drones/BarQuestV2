import fs from 'fs/promises';
import path from 'path';
// import Ajv from 'ajv';
// import addFormats from 'ajv-formats';

// Import all the types to be used in the GameData interface
import * as T from './types';

/**
 * A structure to hold all the indexed game data for easy access.
 * Most data is stored as a Record (or dictionary) mapping an item's ID to its object.
 */
export interface GameData {
  affixes: Record<string, T.Affixe>;
  classes: Record<string, T.Classe>;
  donjons: Record<string, T.Donjon>;
  dropTables: Record<string, T.DropTable>;
  monstres: Record<string, T.Monstre>;
  objets: Record<string, T.Objet>;
  talents: Record<string, T.Talent>;
  // Equilibrage is a single configuration object, not an indexed list.
  equilibrage: T.Equilibrage;
}

/**
 * The DataLoader is responsible for loading all game data from JSON files,
 * validating them against predefined schemas, and indexing them for efficient
 * runtime access.
 */
export class DataLoader {
  // private ajv: Ajv;
  public data: GameData;

  constructor() {
    // this.ajv = new Ajv({ allErrors: true, useDefaults: true });
    // addFormats(this.ajv); // For additional formats like 'uri', etc.

    // Initialize with an empty data structure.
    this.data = {
      affixes: {},
      classes: {},
      donjons: {},
      dropTables: {},
      monstres: {},
      objets: {},
      talents: {},
      // This will be populated from equilibrage.json
      equilibrage: {} as T.Equilibrage,
    };
  }

  /**
   * Loads all game data from the specified directory path.
   * It reads all .json files, validates them against their corresponding .schema.json,
   * and populates the `this.data` property.
   * @param dataPath The path to the directory containing the data files (e.g., 'data/sample').
   */
  public async load(dataPath: string): Promise<void> {
    // const schemasPath = path.resolve(process.cwd(), 'schemas');

    // // First, load all schemas into AJV so they can reference each other.
    // const schemaFiles = await fs.readdir(schemasPath);
    // for (const schemaFile of schemaFiles) {
    //   if (schemaFile.endsWith('.schema.json')) {
    //     const schemaContent = JSON.parse(await fs.readFile(path.join(schemasPath, schemaFile), 'utf-8'));
    //     // The schema is added with its filename as the key, e.g., 'stats.schema.json'.
    //     this.ajv.addSchema(schemaContent, schemaFile);
    //   }
    // }

    // Now, read the data files, validate, and index them.
    const dataFiles = await fs.readdir(dataPath);
    for (const dataFile of dataFiles) {
      if (dataFile.endsWith('.json')) {
        const entityName = dataFile.replace('.json', '');
        // const schemaName = `${entityName}.schema.json`;

        const fileContent = await fs.readFile(path.join(dataPath, dataFile), 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // const validate = this.ajv.getSchema(schemaName);
        // if (!validate) {
        //   throw new Error(`Schema not found for data file: ${dataFile}. Expected to find '${schemaName}'.`);
        // }

        // // Perform validation.
        // if (!validate(jsonData)) {
        //   const errorMessages = validate.errors?.map(e => `  - ${e.instancePath || 'root'}: ${e.message}`).join('\n');
        //   console.error(`Validation failed for ${dataFile}:\n${errorMessages}`);
        //   throw new Error(`Invalid data structure in ${dataFile}.`);
        // }

        // If data is valid, index it.
        if (Array.isArray(jsonData)) {
          // Data is an array of items with IDs. Index them into a Record.
          const indexedData = jsonData.reduce((acc, item) => {
            if (!item.id) {
              throw new Error(`Item in ${dataFile} is missing a required 'id' field for indexing.`);
            }
            if (acc[item.id]) {
                throw new Error(`Duplicate ID '${item.id}' found in ${dataFile}. IDs must be unique.`);
            }
            acc[item.id] = item;
            return acc;
          }, {} as Record<string, any>);
          (this.data as any)[entityName] = indexedData;
        } else {
          // Data is a single object (e.g., equilibrage.json).
          (this.data as any)[entityName] = jsonData;
        }
      }
    }
  }
}
