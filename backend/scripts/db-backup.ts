import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function main() {
  const rootDir = path.resolve(__dirname, '../../');
  const backupDir = path.join(rootDir, 'backup');
  const dumpFile = path.join(backupDir, 'techparts_dump.sql');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const containerName = process.env.POSTGRES_CONTAINER || 'techparts-postgres';
  const dbUser = process.env.POSTGRES_USER || 'techparts_admin';
  const dbName = process.env.POSTGRES_DB || 'techparts_db';

  console.log(`📦 [TechParts Backup] Extrayendo dump de PostgreSQL (${containerName})...`);

  try {
    const cmd = `docker exec ${containerName} pg_dump -U ${dbUser} -d ${dbName} --clean --if-exists`;
    const sqlOutput = execSync(cmd, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer

    fs.writeFileSync(dumpFile, sqlOutput);

    const stats = fs.statSync(dumpFile);
    console.log(`✅ [TechParts Backup] Dump generado exitosamente en: ${dumpFile} (${(stats.size / 1024).toFixed(2)} KB)`);
  } catch (error: any) {
    console.error('❌ Error al generar el backup:', error.message);
    process.exit(1);
  }
}

main();
