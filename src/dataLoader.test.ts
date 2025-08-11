import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataLoader } from './dataLoader';
import fs from 'fs/promises';
import path from 'path';

describe('DataLoader', () => {
  let loader: DataLoader;
  const tempDirs: string[] = [];

  beforeEach(() => {
    loader = new DataLoader();
  });

  afterEach(async () => {
    // Clean up any temporary directories created during tests
    for (const dir of tempDirs) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0; // Clear the array
  });

  it('should load and index all sample game data correctly', async () => {
    // This test uses the actual sample data provided with the project.
    await loader.load('data/sample');

    const data = loader.data;

    // Check that the single configuration object is loaded correctly.
    expect(data.equilibrage).toBeDefined();
    expect(data.equilibrage.params.k).toBe(50.0);

    // Check that the array-based data is correctly indexed by ID.
    expect(Object.keys(data.classes).length).toBe(1);
    expect(data.classes['war']).toBeDefined();
    expect(data.classes['war'].nom).toBe('Guerrier');

    expect(Object.keys(data.monstres).length).toBe(1);
    expect(data.monstres['boar']).toBeDefined();
    expect(data.monstres['boar'].famille).toBe('bête');

    expect(Object.keys(data.objets).length).toBe(1);
    expect(data.objets['rust_sword']).toBeDefined();
    expect(data.objets['rust_sword'].rareté).toBe('Commun');

    expect(Object.keys(data.talents).length).toBe(1);
    expect(data.talents['war_t1']).toBeDefined();
    expect(data.talents['war_t1'].nom).toBe('Frénésie');

    expect(Object.keys(data.dropTables).length).toBe(1);
    expect(data.dropTables['lt_t1']).toBeDefined();
  });

  it('should throw an error for duplicate IDs within a single file', async () => {
    const tempDir = 'data/temp_duplicate_id';
    tempDirs.push(tempDir);
    await fs.mkdir(tempDir, { recursive: true });
    // This data is structurally valid but contains a duplicate ID.
    const duplicateData = JSON.stringify([
      { id: 'dup_id', nom: 'First', ressource: 'Rage', archétype: 'Mêlée', statsBase: {"PV":100,"AttMin":10,"AttMax":20,"CritPct":0.1,"CritDmg":1.5,"Armure":10,"Vitesse":1,"Precision":0.8,"Esquive":0.1} },
      { id: 'dup_id', nom: 'Second', ressource: 'Rage', archétype: 'Mêlée', statsBase: {"PV":100,"AttMin":10,"AttMax":20,"CritPct":0.1,"CritDmg":1.5,"Armure":10,"Vitesse":1,"Precision":0.8,"Esquive":0.1} },
    ]);
    await fs.writeFile(path.join(tempDir, 'classes.json'), duplicateData);

    await expect(loader.load(tempDir)).rejects.toThrow("Duplicate ID 'dup_id' found in classes.json.");
  });

  it('should throw an error if an item in an array is missing an id', async () => {
    const tempDir = 'data/temp_missing_id';
    tempDirs.push(tempDir);
    await fs.mkdir(tempDir, { recursive: true });
    // This item is missing the 'id' field required for indexing.
    const missingIdData = JSON.stringify([
      { nom: 'Nameless', ressource: 'Mana', archétype: 'Magie', statsBase: {"PV":100,"AttMin":10,"AttMax":20,"CritPct":0.1,"CritDmg":1.5,"Armure":10,"Vitesse":1,"Precision":0.8,"Esquive":0.1} }
    ]);
    await fs.writeFile(path.join(tempDir, 'classes.json'), missingIdData);

    await expect(loader.load(tempDir)).rejects.toThrow("Item in classes.json is missing a required 'id' field for indexing.");
  });
});
