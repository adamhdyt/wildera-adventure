import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { resolve, join } from 'node:path';

interface BackupOptions {
  outputDir?: string;
  retentionDays?: number;
  databaseUrl?: string;
}

export function runBackup(options: BackupOptions = {}) {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL tidak ditemukan. Pastikan variabel lingkungan telah disetel.',
    );
  }

  const outputDir = options.outputDir || resolve(process.cwd(), 'backups');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `wildera_db_${timestamp}.dump`;
  const targetPath = join(outputDir, filename);

  console.log(`[BACKUP] Memulai proses backup database ke: ${targetPath}`);

  try {
    const parsed = new URL(databaseUrl);
    parsed.searchParams.delete('schema');
    parsed.searchParams.delete('connection_limit');
    parsed.searchParams.delete('pool_timeout');

    // No shell or credentials in argv; pg_dump errors may contain credentials.
    execFileSync(
      'pg_dump',
      ['-F', 'c', '--no-owner', '--no-acl', '-f', targetPath],
      {
        env: { ...process.env, PGDATABASE: parsed.toString() },
        stdio: 'ignore',
      },
    );

    // Verifikasi berkas hasil backup
    if (!existsSync(targetPath)) {
      throw new Error(`Berkas backup gagal dibuat di ${targetPath}`);
    }

    const stats = statSync(targetPath);
    if (stats.size === 0) {
      unlinkSync(targetPath);
      throw new Error('Berkas backup berukuran 0 byte (gagal).');
    }

    console.log(
      `[BACKUP] Berhasil membuat backup (${(stats.size / 1024).toFixed(2)} KB).`,
    );

    // Retensi otomatis (hapus berkas lebih lama dari retentionDays)
    const retentionDays = options.retentionDays ?? 14;
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const files = readdirSync(outputDir);
    let removedCount = 0;

    for (const file of files) {
      if (
        file.startsWith('wildera_db_') &&
        (file.endsWith('.dump') || file.endsWith('.sql.gz'))
      ) {
        const filePath = join(outputDir, file);
        const fileStats = statSync(filePath);
        if (fileStats.mtimeMs < cutoffTime) {
          unlinkSync(filePath);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(
        `[BACKUP] Membersihkan ${removedCount} berkas backup lawas (> ${retentionDays} hari).`,
      );
    }

    return {
      success: true,
      path: targetPath,
      sizeBytes: stats.size,
      timestamp,
    };
  } catch {
    const message =
      '[BACKUP] Backup database gagal. Periksa konfigurasi dan ketersediaan pg_dump.';
    console.error(message);
    throw new Error(message);
  }
}

// Eksekusi jika dipanggil langsung
if (
  process.argv[1]?.endsWith('backup-database.mts') ||
  process.argv[1]?.includes('backup-database')
) {
  try {
    runBackup();
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
