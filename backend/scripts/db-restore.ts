import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function main() {
  const rootDir = path.resolve(__dirname, '../../');
  const backupDir = path.join(rootDir, 'backup');
  const dumpFile = process.argv[2] ? path.resolve(process.argv[2]) : path.join(backupDir, 'techparts_dump.sql');

  if (!fs.existsSync(dumpFile)) {
    console.error(`❌ Archivo de dump no encontrado: ${dumpFile}`);
    process.exit(1);
  }

  const containerName = process.env.POSTGRES_CONTAINER || 'techparts-postgres';
  const dbUser = process.env.POSTGRES_USER || 'techparts_admin';
  const dbName = process.env.POSTGRES_DB || 'techparts_db';

  console.log(`🔄 [TechParts Restore] Restaurando desde ${dumpFile} en ${containerName}...`);

  try {
    const cmd = `docker exec -i ${containerName} psql -U ${dbUser} -d ${dbName} < "${dumpFile}"`;
    execSync(cmd, { shell: '/bin/bash', stdio: 'inherit' });

    console.log(`✅ [TechParts Restore] Base de datos restaurada exitosamente.`);
  } catch (error: any) {
    console.error('❌ Error al restaurar la base de datos:', error.message);
    process.exit(1);
  }
}

main();
