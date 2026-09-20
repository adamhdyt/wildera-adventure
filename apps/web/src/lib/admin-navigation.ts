export const adminSections = [
  {
    slug: 'dashboard',
    label: 'Dashboard',
    group: 'Ruang kerja',
    description: 'Ringkasan aktivitas perjalanan dan reservasi.',
  },
  {
    slug: 'trips',
    label: 'Trip',
    group: 'Operasional',
    description: 'Program perjalanan, itinerary, dan publikasi trip.',
  },
  {
    slug: 'schedules',
    label: 'Jadwal',
    group: 'Operasional',
    description: 'Tanggal keberangkatan, paket, dan kapasitas perjalanan.',
  },
  {
    slug: 'bookings',
    label: 'Booking',
    group: 'Operasional',
    description: 'Reservasi dan konfirmasi peserta perjalanan.',
    operational: true,
  },
  {
    slug: 'private-trips',
    label: 'Private trip',
    group: 'Operasional',
    description: 'Permintaan perjalanan privat dan tindak lanjut pelanggan.',
    operational: true,
  },
  {
    slug: 'destinations',
    label: 'Destinasi',
    group: 'Katalog',
    description: 'Wilayah tujuan untuk katalog perjalanan Wildera.',
  },
  {
    slug: 'mountains',
    label: 'Gunung',
    group: 'Katalog',
    description: 'Informasi gunung dan tujuan pendakian.',
  },
  {
    slug: 'routes',
    label: 'Jalur pendakian',
    group: 'Katalog',
    description: 'Jalur dan titik awal pendakian untuk setiap gunung.',
  },
  {
    slug: 'content',
    label: 'Konten',
    group: 'Pengelolaan',
    description: 'FAQ dan informasi untuk membantu calon peserta.',
  },
  {
    slug: 'settings',
    label: 'Pengaturan',
    group: 'Pengelolaan',
    description: 'Informasi bisnis dan preferensi website.',
  },
  {
    slug: 'audit-logs',
    label: 'Audit Log',
    group: 'Pengelolaan',
    description: 'Catatan aktivitas sistem dan riwayat perubahan data.',
    operational: true,
  },
] as const;

export type AdminSection = (typeof adminSections)[number];

export function canViewSection(
  roles: readonly string[],
  section: AdminSection,
) {
  if (roles.includes('SUPER_ADMIN') || roles.includes('OPERATIONS'))
    return true;
  return roles.includes('CONTENT') && !('operational' in section);
}

export function roleLabel(role: string) {
  return (
    (
      {
        SUPER_ADMIN: 'Super admin',
        OPERATIONS: 'Operasional',
        CONTENT: 'Konten',
      } as Record<string, string>
    )[role] ?? 'Role tidak dikenal'
  );
}
