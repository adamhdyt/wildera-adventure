import type {
  AvailabilityStatus,
  BookingQuery,
  BookingSource,
  BookingStatus,
  CancelBookingPayload,
  ContentStatus,
  CreateBookingPayload,
  CreateDestinationPayload,
  CreateContentPagePayload,
  CreateFaqPayload,
  CreateMeetingPointPayload,
  CreateMountainPayload,
  CreatePackagePayload,
  CreateParticipantPayload,
  CreatePrivateTripInquiryPayload,
  CreateRoutePayload,
  CreateSchedulePayload,
  CreateTripPayload,
  ContentPageQueryPayload,
  DestinationQueryPayload,
  DestinationStatus,
  DifficultyLevel,
  EntityStatus,
  FacilityType,
  GearType,
  MountainQueryPayload,
  PrivateTripInquiryQueryPayload,
  PrivateTripStatus,
  PublicMountainQuery,
  PublicTripQuery,
  RouteQueryPayload,
  ScheduleQueryPayload,
  ScheduleStatus,
  TripQueryPayload,
  TripType,
  UpdateBookingPayload,
  UpdateContentPagePayload,
  UpdateDestinationPayload,
  UpdateFaqPayload,
  FaqQueryPayload,
  UpdateMeetingPointPayload,
  UpdateMountainPayload,
  UpdatePackagePayload,
  UpdateParticipantPayload,
  UpdatePrivateTripInquiryPayload,
  UpdateRoutePayload,
  UpdateSchedulePayload,
  UpdateTripContentPayload,
  UpdateTripPayload,
  AnalyticsEventName,
} from '@wildera/types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validateCreateDestination(
  input: unknown,
): ValidationResult<CreateDestinationPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const errors: Record<string, string> = {};

  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  if (!rawName) {
    errors.name = 'Nama destinasi wajib diisi.';
  } else if (rawName.length > 120) {
    errors.name = 'Nama destinasi maksimal 120 karakter.';
  }

  let slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug && rawName) {
    slug = slugify(rawName);
  }
  if (!slug) {
    errors.slug = 'Slug destinasi wajib diisi.';
  } else if (slug.length > 140) {
    errors.slug = 'Slug destinasi maksimal 140 karakter.';
  } else if (!slugRegex.test(slug)) {
    errors.slug =
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-), tidak boleh diawali atau diakhiri tanda hubung.';
  }

  const province =
    typeof body.province === 'string' ? body.province.trim() : null;
  if (province && province.length > 120) {
    errors.province = 'Provinsi maksimal 120 karakter.';
  }

  const region = typeof body.region === 'string' ? body.region.trim() : null;
  if (region && region.length > 120) {
    errors.region = 'Wilayah/region maksimal 120 karakter.';
  }

  const description =
    typeof body.description === 'string' ? body.description.trim() : null;

  let status: DestinationStatus = 'ACTIVE';
  if (body.status !== undefined && body.status !== null) {
    if (body.status === 'ACTIVE' || body.status === 'INACTIVE') {
      status = body.status;
    } else {
      errors.status = 'Status harus bernilai ACTIVE atau INACTIVE.';
    }
  }

  const seoTitle =
    typeof body.seoTitle === 'string' ? body.seoTitle.trim() : null;
  if (seoTitle && seoTitle.length > 160) {
    errors.seoTitle = 'SEO title maksimal 160 karakter.';
  }

  const seoDescription =
    typeof body.seoDescription === 'string' ? body.seoDescription.trim() : null;
  if (seoDescription && seoDescription.length > 320) {
    errors.seoDescription = 'SEO description maksimal 320 karakter.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: rawName,
      slug,
      province,
      region,
      description,
      status,
      seoTitle,
      seoDescription,
    },
  };
}

export function validateUpdateDestination(
  input: unknown,
): ValidationResult<UpdateDestinationPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const errors: Record<string, string> = {};
  const data: UpdateDestinationPayload = {};
  let fieldCount = 0;

  if (body.name !== undefined) {
    fieldCount++;
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName) {
      errors.name = 'Nama destinasi tidak boleh kosong.';
    } else if (rawName.length > 120) {
      errors.name = 'Nama destinasi maksimal 120 karakter.';
    } else {
      data.name = rawName;
    }
  }

  if (body.slug !== undefined) {
    fieldCount++;
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    if (!slug) {
      errors.slug = 'Slug tidak boleh kosong.';
    } else if (slug.length > 140) {
      errors.slug = 'Slug maksimal 140 karakter.';
    } else if (!slugRegex.test(slug)) {
      errors.slug =
        'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).';
    } else {
      data.slug = slug;
    }
  }

  if (body.province !== undefined) {
    fieldCount++;
    const province =
      typeof body.province === 'string' ? body.province.trim() : null;
    if (province && province.length > 120) {
      errors.province = 'Provinsi maksimal 120 karakter.';
    } else {
      data.province = province;
    }
  }

  if (body.region !== undefined) {
    fieldCount++;
    const region = typeof body.region === 'string' ? body.region.trim() : null;
    if (region && region.length > 120) {
      errors.region = 'Wilayah/region maksimal 120 karakter.';
    } else {
      data.region = region;
    }
  }

  if (body.description !== undefined) {
    fieldCount++;
    data.description =
      typeof body.description === 'string' ? body.description.trim() : null;
  }

  if (body.status !== undefined) {
    fieldCount++;
    if (body.status === 'ACTIVE' || body.status === 'INACTIVE') {
      data.status = body.status;
    } else {
      errors.status = 'Status harus bernilai ACTIVE atau INACTIVE.';
    }
  }

  if (body.seoTitle !== undefined) {
    fieldCount++;
    const seoTitle =
      typeof body.seoTitle === 'string' ? body.seoTitle.trim() : null;
    if (seoTitle && seoTitle.length > 160) {
      errors.seoTitle = 'SEO title maksimal 160 karakter.';
    } else {
      data.seoTitle = seoTitle;
    }
  }

  if (body.seoDescription !== undefined) {
    fieldCount++;
    const seoDescription =
      typeof body.seoDescription === 'string'
        ? body.seoDescription.trim()
        : null;
    if (seoDescription && seoDescription.length > 320) {
      errors.seoDescription = 'SEO description maksimal 320 karakter.';
    } else {
      data.seoDescription = seoDescription;
    }
  }

  if (fieldCount === 0) {
    return {
      valid: false,
      errors: { _general: 'Minimal satu kolom harus diisi untuk pembaruan.' },
    };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

export function validateDestinationQuery(
  input: unknown,
): DestinationQueryPayload {
  const query =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : undefined;

  let status: DestinationStatus | 'ALL' | undefined = undefined;
  if (
    query.status === 'ACTIVE' ||
    query.status === 'INACTIVE' ||
    query.status === 'ALL'
  ) {
    status = query.status;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsed = Number.parseInt(String(query.limit), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100);
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsed = Number.parseInt(String(query.offset), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { search, status, limit, offset };
}

const difficultyLevels = new Set<DifficultyLevel>([
  'EASY',
  'MODERATE',
  'HARD',
  'EXTREME',
]);

const contentStatuses = new Set<ContentStatus>([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);

export function validateCreateMountain(
  input: unknown,
): ValidationResult<CreateMountainPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const errors: Record<string, string> = {};

  const destinationId =
    typeof body.destinationId === 'string' ? body.destinationId.trim() : '';
  if (!destinationId) {
    errors.destinationId = 'Destinasi wajib dipilih.';
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  if (!rawName) {
    errors.name = 'Nama gunung wajib diisi.';
  } else if (rawName.length > 160) {
    errors.name = 'Nama gunung maksimal 160 karakter.';
  }

  let slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug && rawName) {
    slug = slugify(rawName);
  }
  if (!slug) {
    errors.slug = 'Slug gunung wajib diisi.';
  } else if (slug.length > 180) {
    errors.slug = 'Slug gunung maksimal 180 karakter.';
  } else if (!slugRegex.test(slug)) {
    errors.slug =
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-), tidak boleh diawali atau diakhiri tanda hubung.';
  }

  let altitudeM: number | null = null;
  if (
    body.altitudeM !== undefined &&
    body.altitudeM !== null &&
    body.altitudeM !== ''
  ) {
    const parsed = Number(body.altitudeM);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9000) {
      errors.altitudeM =
        'Ketinggian (MDPL) harus berupa bilangan bulat antara 0 hingga 9000 meter.';
    } else {
      altitudeM = parsed;
    }
  }

  let defaultDifficulty: DifficultyLevel | null = null;
  if (
    body.defaultDifficulty !== undefined &&
    body.defaultDifficulty !== null &&
    body.defaultDifficulty !== ''
  ) {
    if (difficultyLevels.has(body.defaultDifficulty as DifficultyLevel)) {
      defaultDifficulty = body.defaultDifficulty as DifficultyLevel;
    } else {
      errors.defaultDifficulty =
        'Tingkat kesulitan harus EASY, MODERATE, HARD, atau EXTREME.';
    }
  }

  const bestSeason =
    typeof body.bestSeason === 'string' ? body.bestSeason.trim() : null;
  if (bestSeason && bestSeason.length > 255) {
    errors.bestSeason = 'Musim terbaik maksimal 255 karakter.';
  }

  let latitude: number | string | null = null;
  if (
    body.latitude !== undefined &&
    body.latitude !== null &&
    body.latitude !== ''
  ) {
    const parsed = Number(body.latitude);
    if (Number.isNaN(parsed) || parsed < -90 || parsed > 90) {
      errors.latitude = 'Latitude harus antara -90 dan 90.';
    } else {
      latitude = parsed;
    }
  }

  let longitude: number | string | null = null;
  if (
    body.longitude !== undefined &&
    body.longitude !== null &&
    body.longitude !== ''
  ) {
    const parsed = Number(body.longitude);
    if (Number.isNaN(parsed) || parsed < -180 || parsed > 180) {
      errors.longitude = 'Longitude harus antara -180 dan 180.';
    } else {
      longitude = parsed;
    }
  }

  let status: ContentStatus = 'DRAFT';
  if (body.status !== undefined && body.status !== null && body.status !== '') {
    if (contentStatuses.has(body.status as ContentStatus)) {
      status = body.status as ContentStatus;
    } else {
      errors.status = 'Status harus DRAFT, PUBLISHED, atau ARCHIVED.';
    }
  }

  const shortDescription =
    typeof body.shortDescription === 'string'
      ? body.shortDescription.trim()
      : null;
  const description =
    typeof body.description === 'string' ? body.description.trim() : null;

  const seoTitle =
    typeof body.seoTitle === 'string' ? body.seoTitle.trim() : null;
  if (seoTitle && seoTitle.length > 160) {
    errors.seoTitle = 'SEO title maksimal 160 karakter.';
  }

  const seoDescription =
    typeof body.seoDescription === 'string' ? body.seoDescription.trim() : null;
  if (seoDescription && seoDescription.length > 320) {
    errors.seoDescription = 'SEO description maksimal 320 karakter.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      destinationId,
      name: rawName,
      slug,
      altitudeM,
      shortDescription,
      description,
      defaultDifficulty,
      bestSeason,
      latitude,
      longitude,
      status,
      seoTitle,
      seoDescription,
    },
  };
}

export function validateUpdateMountain(
  input: unknown,
): ValidationResult<UpdateMountainPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const errors: Record<string, string> = {};
  const data: UpdateMountainPayload = {};
  let fieldCount = 0;

  if (body.destinationId !== undefined) {
    fieldCount++;
    const destId =
      typeof body.destinationId === 'string' ? body.destinationId.trim() : '';
    if (!destId) {
      errors.destinationId = 'Destinasi tidak boleh kosong.';
    } else {
      data.destinationId = destId;
    }
  }

  if (body.name !== undefined) {
    fieldCount++;
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName) {
      errors.name = 'Nama gunung tidak boleh kosong.';
    } else if (rawName.length > 160) {
      errors.name = 'Nama gunung maksimal 160 karakter.';
    } else {
      data.name = rawName;
    }
  }

  if (body.slug !== undefined) {
    fieldCount++;
    const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
    if (!slug) {
      errors.slug = 'Slug gunung tidak boleh kosong.';
    } else if (slug.length > 180) {
      errors.slug = 'Slug gunung maksimal 180 karakter.';
    } else if (!slugRegex.test(slug)) {
      errors.slug =
        'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-), tidak boleh diawali atau diakhiri tanda hubung.';
    } else {
      data.slug = slug;
    }
  }

  if (body.altitudeM !== undefined) {
    fieldCount++;
    if (body.altitudeM === null || body.altitudeM === '') {
      data.altitudeM = null;
    } else {
      const parsed = Number(body.altitudeM);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 9000) {
        errors.altitudeM =
          'Ketinggian (MDPL) harus berupa bilangan bulat antara 0 hingga 9000 meter.';
      } else {
        data.altitudeM = parsed;
      }
    }
  }

  if (body.defaultDifficulty !== undefined) {
    fieldCount++;
    if (body.defaultDifficulty === null || body.defaultDifficulty === '') {
      data.defaultDifficulty = null;
    } else if (
      difficultyLevels.has(body.defaultDifficulty as DifficultyLevel)
    ) {
      data.defaultDifficulty = body.defaultDifficulty as DifficultyLevel;
    } else {
      errors.defaultDifficulty =
        'Tingkat kesulitan harus EASY, MODERATE, HARD, atau EXTREME.';
    }
  }

  if (body.bestSeason !== undefined) {
    fieldCount++;
    const bestSeason =
      typeof body.bestSeason === 'string' ? body.bestSeason.trim() : null;
    if (bestSeason && bestSeason.length > 255) {
      errors.bestSeason = 'Musim terbaik maksimal 255 karakter.';
    } else {
      data.bestSeason = bestSeason;
    }
  }

  if (body.latitude !== undefined) {
    fieldCount++;
    if (body.latitude === null || body.latitude === '') {
      data.latitude = null;
    } else {
      const parsed = Number(body.latitude);
      if (Number.isNaN(parsed) || parsed < -90 || parsed > 90) {
        errors.latitude = 'Latitude harus antara -90 dan 90.';
      } else {
        data.latitude = parsed;
      }
    }
  }

  if (body.longitude !== undefined) {
    fieldCount++;
    if (body.longitude === null || body.longitude === '') {
      data.longitude = null;
    } else {
      const parsed = Number(body.longitude);
      if (Number.isNaN(parsed) || parsed < -180 || parsed > 180) {
        errors.longitude = 'Longitude harus antara -180 dan 180.';
      } else {
        data.longitude = parsed;
      }
    }
  }

  if (body.status !== undefined) {
    fieldCount++;
    if (contentStatuses.has(body.status as ContentStatus)) {
      data.status = body.status as ContentStatus;
    } else {
      errors.status = 'Status harus DRAFT, PUBLISHED, atau ARCHIVED.';
    }
  }

  if (body.shortDescription !== undefined) {
    fieldCount++;
    data.shortDescription =
      typeof body.shortDescription === 'string'
        ? body.shortDescription.trim()
        : null;
  }

  if (body.description !== undefined) {
    fieldCount++;
    data.description =
      typeof body.description === 'string' ? body.description.trim() : null;
  }

  if (body.seoTitle !== undefined) {
    fieldCount++;
    const seoTitle =
      typeof body.seoTitle === 'string' ? body.seoTitle.trim() : null;
    if (seoTitle && seoTitle.length > 160) {
      errors.seoTitle = 'SEO title maksimal 160 karakter.';
    } else {
      data.seoTitle = seoTitle;
    }
  }

  if (body.seoDescription !== undefined) {
    fieldCount++;
    const seoDescription =
      typeof body.seoDescription === 'string'
        ? body.seoDescription.trim()
        : null;
    if (seoDescription && seoDescription.length > 320) {
      errors.seoDescription = 'SEO description maksimal 320 karakter.';
    } else {
      data.seoDescription = seoDescription;
    }
  }

  if (fieldCount === 0) {
    return {
      valid: false,
      errors: { _general: 'Minimal satu kolom harus diisi untuk pembaruan.' },
    };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

export function validateMountainQuery(input: unknown): MountainQueryPayload {
  const query =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : undefined;

  const destinationId =
    typeof query.destinationId === 'string' &&
    query.destinationId.trim().length > 0
      ? query.destinationId.trim()
      : undefined;

  let status: ContentStatus | 'ALL' | undefined = undefined;
  if (
    query.status === 'DRAFT' ||
    query.status === 'PUBLISHED' ||
    query.status === 'ARCHIVED' ||
    query.status === 'ALL'
  ) {
    status = query.status;
  }

  let difficulty: DifficultyLevel | 'ALL' | undefined = undefined;
  if (
    query.difficulty === 'EASY' ||
    query.difficulty === 'MODERATE' ||
    query.difficulty === 'HARD' ||
    query.difficulty === 'EXTREME' ||
    query.difficulty === 'ALL'
  ) {
    difficulty = query.difficulty;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsed = Number.parseInt(String(query.limit), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100);
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsed = Number.parseInt(String(query.offset), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { search, destinationId, status, difficulty, limit, offset };
}

export function validateCreateRoute(
  input: unknown,
):
  | { valid: true; data: CreateRoutePayload }
  | { valid: false; errors: Record<string, string> } {
  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _general: 'Data request tidak valid.' },
    };
  }

  const payload = input as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (
    typeof payload.mountainId !== 'string' ||
    payload.mountainId.trim().length === 0
  ) {
    errors.mountainId = 'Gunung wajib dipilih.';
  }

  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    errors.name = 'Nama jalur wajib diisi.';
  } else if (payload.name.trim().length > 160) {
    errors.name = 'Nama jalur maksimal 160 karakter.';
  }

  let slug: string;
  if (typeof payload.slug === 'string' && payload.slug.trim().length > 0) {
    slug = payload.slug.trim().toLowerCase();
    if (slug.length > 180) {
      errors.slug = 'Slug maksimal 180 karakter.';
    } else if (!slugRegex.test(slug)) {
      errors.slug =
        'Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).';
    }
  } else if (
    typeof payload.name === 'string' &&
    payload.name.trim().length > 0
  ) {
    slug = slugify(payload.name);
    if (!slug) {
      slug = `route-${Date.now()}`;
    }
  } else {
    slug = '';
  }

  let distanceKm: number | undefined = undefined;
  if (
    payload.distanceKm !== undefined &&
    payload.distanceKm !== null &&
    payload.distanceKm !== ''
  ) {
    const parsed = Number(payload.distanceKm);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 999.99) {
      errors.distanceKm = 'Jarak harus berupa angka valid (0 - 999.99 km).';
    } else {
      distanceKm = parsed;
    }
  }

  let elevationGainM: number | undefined = undefined;
  if (
    payload.elevationGainM !== undefined &&
    payload.elevationGainM !== null &&
    payload.elevationGainM !== ''
  ) {
    const parsed = Number.parseInt(String(payload.elevationGainM), 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 9000) {
      errors.elevationGainM =
        'Elevasi harus berupa bilangan bulat antara 0 - 9000 meter.';
    } else {
      elevationGainM = parsed;
    }
  }

  let estimatedDurationHours: number | undefined = undefined;
  if (
    payload.estimatedDurationHours !== undefined &&
    payload.estimatedDurationHours !== null &&
    payload.estimatedDurationHours !== ''
  ) {
    const parsed = Number(payload.estimatedDurationHours);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 999.99) {
      errors.estimatedDurationHours =
        'Estimasi durasi harus berupa angka valid (jam).';
    } else {
      estimatedDurationHours = parsed;
    }
  }

  let difficulty: DifficultyLevel | undefined = undefined;
  if (
    payload.difficulty !== undefined &&
    payload.difficulty !== null &&
    payload.difficulty !== ''
  ) {
    if (
      payload.difficulty !== 'EASY' &&
      payload.difficulty !== 'MODERATE' &&
      payload.difficulty !== 'HARD' &&
      payload.difficulty !== 'EXTREME'
    ) {
      errors.difficulty = 'Tingkat kesulitan tidak valid.';
    } else {
      difficulty = payload.difficulty as DifficultyLevel;
    }
  }

  let status: ContentStatus = 'DRAFT';
  if (payload.status !== undefined && payload.status !== null) {
    if (
      payload.status !== 'DRAFT' &&
      payload.status !== 'PUBLISHED' &&
      payload.status !== 'ARCHIVED'
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      status = payload.status as ContentStatus;
    }
  }

  let startingPoint: string | undefined = undefined;
  if (
    typeof payload.startingPoint === 'string' &&
    payload.startingPoint.trim().length > 0
  ) {
    if (payload.startingPoint.trim().length > 255) {
      errors.startingPoint =
        'Titik awal (starting point) maksimal 255 karakter.';
    } else {
      startingPoint = payload.startingPoint.trim();
    }
  }

  const description =
    typeof payload.description === 'string' &&
    payload.description.trim().length > 0
      ? payload.description.trim()
      : undefined;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      mountainId: (payload.mountainId as string).trim(),
      name: (payload.name as string).trim(),
      slug,
      description,
      distanceKm,
      elevationGainM,
      estimatedDurationHours,
      difficulty,
      startingPoint,
      status,
    },
  };
}

export function validateUpdateRoute(
  input: unknown,
):
  | { valid: true; data: UpdateRoutePayload }
  | { valid: false; errors: Record<string, string> } {
  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _general: 'Data request tidak valid.' },
    };
  }

  const payload = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: UpdateRoutePayload = {};
  let fieldCount = 0;

  if (payload.mountainId !== undefined) {
    fieldCount++;
    if (
      typeof payload.mountainId !== 'string' ||
      payload.mountainId.trim().length === 0
    ) {
      errors.mountainId = 'Gunung tidak valid.';
    } else {
      data.mountainId = payload.mountainId.trim();
    }
  }

  if (payload.name !== undefined) {
    fieldCount++;
    if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
      errors.name = 'Nama jalur tidak boleh kosong.';
    } else if (payload.name.trim().length > 160) {
      errors.name = 'Nama jalur maksimal 160 karakter.';
    } else {
      data.name = payload.name.trim();
    }
  }

  if (payload.slug !== undefined) {
    fieldCount++;
    if (typeof payload.slug !== 'string' || payload.slug.trim().length === 0) {
      errors.slug = 'Slug tidak boleh kosong.';
    } else {
      const slug = payload.slug.trim().toLowerCase();
      if (slug.length > 180) {
        errors.slug = 'Slug maksimal 180 karakter.';
      } else if (!slugRegex.test(slug)) {
        errors.slug =
          'Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).';
      } else {
        data.slug = slug;
      }
    }
  }

  if (payload.description !== undefined) {
    fieldCount++;
    data.description =
      typeof payload.description === 'string' &&
      payload.description.trim().length > 0
        ? payload.description.trim()
        : null;
  }

  if (payload.distanceKm !== undefined) {
    fieldCount++;
    if (payload.distanceKm === null || payload.distanceKm === '') {
      data.distanceKm = null;
    } else {
      const parsed = Number(payload.distanceKm);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 999.99) {
        errors.distanceKm = 'Jarak harus berupa angka valid (0 - 999.99 km).';
      } else {
        data.distanceKm = parsed;
      }
    }
  }

  if (payload.elevationGainM !== undefined) {
    fieldCount++;
    if (payload.elevationGainM === null || payload.elevationGainM === '') {
      data.elevationGainM = null;
    } else {
      const parsed = Number.parseInt(String(payload.elevationGainM), 10);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 9000) {
        errors.elevationGainM =
          'Elevasi harus berupa bilangan bulat antara 0 - 9000 meter.';
      } else {
        data.elevationGainM = parsed;
      }
    }
  }

  if (payload.estimatedDurationHours !== undefined) {
    fieldCount++;
    if (
      payload.estimatedDurationHours === null ||
      payload.estimatedDurationHours === ''
    ) {
      data.estimatedDurationHours = null;
    } else {
      const parsed = Number(payload.estimatedDurationHours);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 999.99) {
        errors.estimatedDurationHours =
          'Estimasi durasi harus berupa angka valid (jam).';
      } else {
        data.estimatedDurationHours = parsed;
      }
    }
  }

  if (payload.difficulty !== undefined) {
    fieldCount++;
    if (payload.difficulty === null || payload.difficulty === '') {
      data.difficulty = null;
    } else if (
      payload.difficulty !== 'EASY' &&
      payload.difficulty !== 'MODERATE' &&
      payload.difficulty !== 'HARD' &&
      payload.difficulty !== 'EXTREME'
    ) {
      errors.difficulty = 'Tingkat kesulitan tidak valid.';
    } else {
      data.difficulty = payload.difficulty as DifficultyLevel;
    }
  }

  if (payload.status !== undefined) {
    fieldCount++;
    if (
      payload.status !== 'DRAFT' &&
      payload.status !== 'PUBLISHED' &&
      payload.status !== 'ARCHIVED'
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      data.status = payload.status as ContentStatus;
    }
  }

  if (payload.startingPoint !== undefined) {
    fieldCount++;
    if (payload.startingPoint === null || payload.startingPoint === '') {
      data.startingPoint = null;
    } else if (typeof payload.startingPoint === 'string') {
      if (payload.startingPoint.trim().length > 255) {
        errors.startingPoint = 'Titik awal maksimal 255 karakter.';
      } else {
        data.startingPoint = payload.startingPoint.trim();
      }
    } else {
      errors.startingPoint = 'Titik awal tidak valid.';
    }
  }

  if (fieldCount === 0) {
    return {
      valid: false,
      errors: { _general: 'Minimal satu kolom harus diisi untuk pembaruan.' },
    };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

export function validateRouteQuery(input: unknown): RouteQueryPayload {
  const query =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : undefined;

  const mountainId =
    typeof query.mountainId === 'string' && query.mountainId.trim().length > 0
      ? query.mountainId.trim()
      : undefined;

  let status: ContentStatus | 'ALL' | undefined = undefined;
  if (
    query.status === 'DRAFT' ||
    query.status === 'PUBLISHED' ||
    query.status === 'ARCHIVED' ||
    query.status === 'ALL'
  ) {
    status = query.status;
  }

  let difficulty: DifficultyLevel | 'ALL' | undefined = undefined;
  if (
    query.difficulty === 'EASY' ||
    query.difficulty === 'MODERATE' ||
    query.difficulty === 'HARD' ||
    query.difficulty === 'EXTREME' ||
    query.difficulty === 'ALL'
  ) {
    difficulty = query.difficulty;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsed = Number.parseInt(String(query.limit), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100);
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsed = Number.parseInt(String(query.offset), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { search, mountainId, status, difficulty, limit, offset };
}

const VALID_TRIP_TYPES: TripType[] = [
  'OPEN_TRIP',
  'PRIVATE_TRIP',
  'TEKTOK',
  'MULTI_DAY',
];

export function validateCreateTrip(
  input: unknown,
):
  | { valid: true; data: CreateTripPayload }
  | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _global: 'Payload harus berupa object.' },
    };
  }

  const payload = input as Record<string, unknown>;

  if (
    typeof payload.mountainId !== 'string' ||
    payload.mountainId.trim().length === 0
  ) {
    errors.mountainId = 'Gunung wajib dipilih.';
  }

  let routeId: string | null = null;
  if (
    typeof payload.routeId === 'string' &&
    payload.routeId.trim().length > 0
  ) {
    routeId = payload.routeId.trim();
  }

  if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
    errors.name = 'Nama trip wajib diisi.';
  } else if (payload.name.trim().length > 200) {
    errors.name = 'Nama trip maksimal 200 karakter.';
  }

  let slug = '';
  if (typeof payload.slug === 'string' && payload.slug.trim().length > 0) {
    slug = slugify(payload.slug.trim());
    if (!slugRegex.test(slug)) {
      errors.slug =
        'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).';
    } else if (slug.length > 220) {
      errors.slug = 'Slug maksimal 220 karakter.';
    }
  } else if (
    typeof payload.name === 'string' &&
    payload.name.trim().length > 0
  ) {
    slug = slugify(payload.name.trim());
    if (slug.length > 220) {
      errors.slug = 'Slug otomatis melebihi 220 karakter.';
    }
  }

  let tripType: TripType = 'OPEN_TRIP';
  if (
    typeof payload.tripType === 'string' &&
    VALID_TRIP_TYPES.includes(payload.tripType as TripType)
  ) {
    tripType = payload.tripType as TripType;
  } else {
    errors.tripType =
      'Tipe trip tidak valid (harus OPEN_TRIP, PRIVATE_TRIP, TEKTOK, atau MULTI_DAY).';
  }

  let durationDays = 1;
  if (payload.durationDays === undefined || payload.durationDays === null) {
    errors.durationDays = 'Durasi hari (durationDays) wajib diisi.';
  } else {
    const days = Number(payload.durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      errors.durationDays =
        'Durasi hari harus bilangan bulat antara 1 dan 365.';
    } else {
      durationDays = days;
    }
  }

  let durationNights = 0;
  if (
    payload.durationNights !== undefined &&
    payload.durationNights !== null &&
    String(payload.durationNights).trim() !== ''
  ) {
    const nights = Number(payload.durationNights);
    if (!Number.isInteger(nights) || nights < 0 || nights > 365) {
      errors.durationNights =
        'Durasi malam harus bilangan bulat antara 0 dan 365.';
    } else {
      durationNights = nights;
    }
  }

  let difficulty: DifficultyLevel = 'MODERATE';
  if (
    typeof payload.difficulty === 'string' &&
    difficultyLevels.has(payload.difficulty as DifficultyLevel)
  ) {
    difficulty = payload.difficulty as DifficultyLevel;
  } else {
    errors.difficulty =
      'Tingkat kesulitan tidak valid (harus EASY, MODERATE, HARD, atau EXTREME).';
  }

  const beginnerFriendly = Boolean(payload.beginnerFriendly);
  const healthCertificateRequired = Boolean(payload.healthCertificateRequired);
  const featured = Boolean(payload.featured);

  let minimumAge: number | null = null;
  if (
    payload.minimumAge !== undefined &&
    payload.minimumAge !== null &&
    String(payload.minimumAge).trim() !== ''
  ) {
    const age = Number(payload.minimumAge);
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      errors.minimumAge = 'Usia minimum harus antara 0 dan 120 tahun.';
    } else {
      minimumAge = age;
    }
  }

  let maximumAge: number | null = null;
  if (
    payload.maximumAge !== undefined &&
    payload.maximumAge !== null &&
    String(payload.maximumAge).trim() !== ''
  ) {
    const age = Number(payload.maximumAge);
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      errors.maximumAge = 'Usia maksimum harus antara 0 dan 120 tahun.';
    } else if (minimumAge !== null && age < minimumAge) {
      errors.maximumAge =
        'Usia maksimum tidak boleh lebih kecil dari usia minimum.';
    } else {
      maximumAge = age;
    }
  }

  let status: ContentStatus = 'DRAFT';
  if (
    typeof payload.status === 'string' &&
    contentStatuses.has(payload.status as ContentStatus)
  ) {
    status = payload.status as ContentStatus;
  }

  const shortDescription =
    typeof payload.shortDescription === 'string' &&
    payload.shortDescription.trim().length > 0
      ? payload.shortDescription.trim()
      : null;

  const description =
    typeof payload.description === 'string' &&
    payload.description.trim().length > 0
      ? payload.description.trim()
      : null;

  let seoTitle: string | null = null;
  if (
    typeof payload.seoTitle === 'string' &&
    payload.seoTitle.trim().length > 0
  ) {
    if (payload.seoTitle.trim().length > 160) {
      errors.seoTitle = 'SEO Title maksimal 160 karakter.';
    } else {
      seoTitle = payload.seoTitle.trim();
    }
  }

  let seoDescription: string | null = null;
  if (
    typeof payload.seoDescription === 'string' &&
    payload.seoDescription.trim().length > 0
  ) {
    if (payload.seoDescription.trim().length > 320) {
      errors.seoDescription = 'SEO Description maksimal 320 karakter.';
    } else {
      seoDescription = payload.seoDescription.trim();
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      mountainId: (payload.mountainId as string).trim(),
      routeId,
      name: (payload.name as string).trim(),
      slug,
      tripType,
      shortDescription,
      description,
      durationDays,
      durationNights,
      difficulty,
      beginnerFriendly,
      healthCertificateRequired,
      minimumAge,
      maximumAge,
      status,
      featured,
      seoTitle,
      seoDescription,
    },
  };
}

export function validateUpdateTrip(
  input: unknown,
):
  | { valid: true; data: UpdateTripPayload }
  | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _global: 'Payload harus berupa object.' },
    };
  }

  const payload = input as Record<string, unknown>;
  const data: UpdateTripPayload = {};
  let fieldCount = 0;

  if (payload.mountainId !== undefined) {
    fieldCount++;
    if (
      typeof payload.mountainId !== 'string' ||
      payload.mountainId.trim().length === 0
    ) {
      errors.mountainId = 'Gunung wajib dipilih.';
    } else {
      data.mountainId = payload.mountainId.trim();
    }
  }

  if (payload.routeId !== undefined) {
    fieldCount++;
    if (payload.routeId === null || payload.routeId === '') {
      data.routeId = null;
    } else if (
      typeof payload.routeId === 'string' &&
      payload.routeId.trim().length > 0
    ) {
      data.routeId = payload.routeId.trim();
    } else {
      errors.routeId = 'Format ID rute tidak valid.';
    }
  }

  if (payload.name !== undefined) {
    fieldCount++;
    if (typeof payload.name !== 'string' || payload.name.trim().length === 0) {
      errors.name = 'Nama trip tidak boleh kosong.';
    } else if (payload.name.trim().length > 200) {
      errors.name = 'Nama trip maksimal 200 karakter.';
    } else {
      data.name = payload.name.trim();
    }
  }

  if (payload.slug !== undefined) {
    fieldCount++;
    if (typeof payload.slug !== 'string' || payload.slug.trim().length === 0) {
      errors.slug = 'Slug tidak boleh kosong.';
    } else {
      const slug = slugify(payload.slug.trim());
      if (!slugRegex.test(slug)) {
        errors.slug =
          'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).';
      } else if (slug.length > 220) {
        errors.slug = 'Slug maksimal 220 karakter.';
      } else {
        data.slug = slug;
      }
    }
  }

  if (payload.tripType !== undefined) {
    fieldCount++;
    if (
      typeof payload.tripType === 'string' &&
      VALID_TRIP_TYPES.includes(payload.tripType as TripType)
    ) {
      data.tripType = payload.tripType as TripType;
    } else {
      errors.tripType =
        'Tipe trip tidak valid (harus OPEN_TRIP, PRIVATE_TRIP, TEKTOK, atau MULTI_DAY).';
    }
  }

  if (payload.durationDays !== undefined) {
    fieldCount++;
    const days = Number(payload.durationDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      errors.durationDays =
        'Durasi hari harus bilangan bulat antara 1 dan 365.';
    } else {
      data.durationDays = days;
    }
  }

  if (payload.durationNights !== undefined) {
    fieldCount++;
    const nights = Number(payload.durationNights);
    if (!Number.isInteger(nights) || nights < 0 || nights > 365) {
      errors.durationNights =
        'Durasi malam harus bilangan bulat antara 0 dan 365.';
    } else {
      data.durationNights = nights;
    }
  }

  if (payload.difficulty !== undefined) {
    fieldCount++;
    if (
      typeof payload.difficulty === 'string' &&
      difficultyLevels.has(payload.difficulty as DifficultyLevel)
    ) {
      data.difficulty = payload.difficulty as DifficultyLevel;
    } else {
      errors.difficulty =
        'Tingkat kesulitan tidak valid (harus EASY, MODERATE, HARD, atau EXTREME).';
    }
  }

  if (payload.beginnerFriendly !== undefined) {
    fieldCount++;
    data.beginnerFriendly = Boolean(payload.beginnerFriendly);
  }

  if (payload.healthCertificateRequired !== undefined) {
    fieldCount++;
    data.healthCertificateRequired = Boolean(payload.healthCertificateRequired);
  }

  if (payload.featured !== undefined) {
    fieldCount++;
    data.featured = Boolean(payload.featured);
  }

  if (payload.minimumAge !== undefined) {
    fieldCount++;
    if (payload.minimumAge === null || payload.minimumAge === '') {
      data.minimumAge = null;
    } else {
      const age = Number(payload.minimumAge);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        errors.minimumAge = 'Usia minimum harus antara 0 dan 120 tahun.';
      } else {
        data.minimumAge = age;
      }
    }
  }

  if (payload.maximumAge !== undefined) {
    fieldCount++;
    if (payload.maximumAge === null || payload.maximumAge === '') {
      data.maximumAge = null;
    } else {
      const age = Number(payload.maximumAge);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        errors.maximumAge = 'Usia maksimum harus antara 0 dan 120 tahun.';
      } else {
        data.maximumAge = age;
      }
    }
  }

  if (payload.status !== undefined) {
    fieldCount++;
    if (
      typeof payload.status === 'string' &&
      contentStatuses.has(payload.status as ContentStatus)
    ) {
      data.status = payload.status as ContentStatus;
    } else {
      errors.status =
        'Status konten tidak valid (harus DRAFT, PUBLISHED, atau ARCHIVED).';
    }
  }

  if (payload.shortDescription !== undefined) {
    fieldCount++;
    data.shortDescription =
      typeof payload.shortDescription === 'string' &&
      payload.shortDescription.trim().length > 0
        ? payload.shortDescription.trim()
        : null;
  }

  if (payload.description !== undefined) {
    fieldCount++;
    data.description =
      typeof payload.description === 'string' &&
      payload.description.trim().length > 0
        ? payload.description.trim()
        : null;
  }

  if (payload.seoTitle !== undefined) {
    fieldCount++;
    if (
      typeof payload.seoTitle === 'string' &&
      payload.seoTitle.trim().length > 160
    ) {
      errors.seoTitle = 'SEO Title maksimal 160 karakter.';
    } else {
      data.seoTitle =
        typeof payload.seoTitle === 'string' &&
        payload.seoTitle.trim().length > 0
          ? payload.seoTitle.trim()
          : null;
    }
  }

  if (payload.seoDescription !== undefined) {
    fieldCount++;
    if (
      typeof payload.seoDescription === 'string' &&
      payload.seoDescription.trim().length > 320
    ) {
      errors.seoDescription = 'SEO Description maksimal 320 karakter.';
    } else {
      data.seoDescription =
        typeof payload.seoDescription === 'string' &&
        payload.seoDescription.trim().length > 0
          ? payload.seoDescription.trim()
          : null;
    }
  }

  if (fieldCount === 0) {
    return {
      valid: false,
      errors: { _global: 'Setidaknya satu field harus diperbarui.' },
    };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

export function validateTripQuery(input: unknown): TripQueryPayload {
  const query =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const search =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : undefined;

  const mountainId =
    typeof query.mountainId === 'string' && query.mountainId.trim().length > 0
      ? query.mountainId.trim()
      : undefined;

  const routeId =
    typeof query.routeId === 'string' && query.routeId.trim().length > 0
      ? query.routeId.trim()
      : undefined;

  let tripType: TripType | 'ALL' | undefined = undefined;
  if (
    query.tripType === 'OPEN_TRIP' ||
    query.tripType === 'PRIVATE_TRIP' ||
    query.tripType === 'TEKTOK' ||
    query.tripType === 'MULTI_DAY' ||
    query.tripType === 'ALL'
  ) {
    tripType = query.tripType;
  }

  let difficulty: DifficultyLevel | 'ALL' | undefined = undefined;
  if (
    query.difficulty === 'EASY' ||
    query.difficulty === 'MODERATE' ||
    query.difficulty === 'HARD' ||
    query.difficulty === 'EXTREME' ||
    query.difficulty === 'ALL'
  ) {
    difficulty = query.difficulty;
  }

  let status: ContentStatus | 'ALL' | undefined = undefined;
  if (
    query.status === 'DRAFT' ||
    query.status === 'PUBLISHED' ||
    query.status === 'ARCHIVED' ||
    query.status === 'ALL'
  ) {
    status = query.status;
  }

  let featured: boolean | string | undefined = undefined;
  if (query.featured === 'true' || query.featured === true) {
    featured = true;
  } else if (query.featured === 'false' || query.featured === false) {
    featured = false;
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsed = Number.parseInt(String(query.limit), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100);
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsed = Number.parseInt(String(query.offset), 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return {
    search,
    mountainId,
    routeId,
    tripType,
    difficulty,
    status,
    featured,
    limit,
    offset,
  };
}

export function validateUpdateTripContent(
  input: unknown,
):
  | { valid: true; data: UpdateTripContentPayload }
  | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _global: 'Payload harus berupa object.' },
    };
  }

  const payload = input as Record<string, unknown>;
  const data: UpdateTripContentPayload = {};

  // Validate itineraries
  if (payload.itineraries !== undefined) {
    if (!Array.isArray(payload.itineraries)) {
      errors.itineraries = 'Itineraries harus berupa array.';
    } else {
      const itinerariesList: Array<{
        dayNumber: number;
        title: string;
        description?: string | null;
        sortOrder?: number;
      }> = [];
      const seenDays = new Set<number>();

      for (let i = 0; i < payload.itineraries.length; i++) {
        const item = payload.itineraries[i];
        if (typeof item !== 'object' || item === null) {
          errors[`itineraries[${i}]`] = 'Item itinerary harus berupa object.';
          continue;
        }
        const it = item as Record<string, unknown>;
        const dayNumber = Number(it.dayNumber);
        if (!dayNumber || Number.isNaN(dayNumber) || dayNumber < 1) {
          errors[`itineraries[${i}].dayNumber`] = 'Hari (dayNumber) minimal 1.';
        } else if (seenDays.has(dayNumber)) {
          errors[`itineraries[${i}].dayNumber`] =
            `Hari ke-${dayNumber} terduplikasi.`;
        } else {
          seenDays.add(dayNumber);
        }

        if (typeof it.title !== 'string' || it.title.trim().length === 0) {
          errors[`itineraries[${i}].title`] =
            'Judul kegiatan hari wajib diisi.';
        } else if (it.title.trim().length > 200) {
          errors[`itineraries[${i}].title`] =
            'Judul kegiatan maksimal 200 karakter.';
        }

        let desc: string | null | undefined = undefined;
        if (typeof it.description === 'string') {
          desc = it.description.trim() || null;
        }

        const sortOrder =
          typeof it.sortOrder === 'number'
            ? it.sortOrder
            : !Number.isNaN(Number(it.sortOrder))
              ? Number(it.sortOrder)
              : dayNumber;

        itinerariesList.push({
          dayNumber,
          title: typeof it.title === 'string' ? it.title.trim() : '',
          description: desc,
          sortOrder,
        });
      }
      data.itineraries = itinerariesList;
    }
  }

  // Validate facilities
  if (payload.facilities !== undefined) {
    if (!Array.isArray(payload.facilities)) {
      errors.facilities = 'Fasilitas harus berupa array.';
    } else {
      const facilitiesList: Array<{
        facilityType: FacilityType;
        name: string;
        description?: string | null;
        sortOrder?: number;
      }> = [];

      for (let i = 0; i < payload.facilities.length; i++) {
        const item = payload.facilities[i];
        if (typeof item !== 'object' || item === null) {
          errors[`facilities[${i}]`] = 'Item fasilitas harus berupa object.';
          continue;
        }
        const fac = item as Record<string, unknown>;
        const facilityType = fac.facilityType as FacilityType;
        if (facilityType !== 'INCLUDE' && facilityType !== 'EXCLUDE') {
          errors[`facilities[${i}].facilityType`] =
            'Tipe fasilitas harus INCLUDE atau EXCLUDE.';
        }

        if (typeof fac.name !== 'string' || fac.name.trim().length === 0) {
          errors[`facilities[${i}].name`] = 'Nama fasilitas wajib diisi.';
        } else if (fac.name.trim().length > 200) {
          errors[`facilities[${i}].name`] =
            'Nama fasilitas maksimal 200 karakter.';
        }

        let desc: string | null | undefined = undefined;
        if (typeof fac.description === 'string') {
          desc = fac.description.trim() || null;
        }

        const sortOrder =
          typeof fac.sortOrder === 'number'
            ? fac.sortOrder
            : !Number.isNaN(Number(fac.sortOrder))
              ? Number(fac.sortOrder)
              : i;

        facilitiesList.push({
          facilityType,
          name: typeof fac.name === 'string' ? fac.name.trim() : '',
          description: desc,
          sortOrder,
        });
      }
      data.facilities = facilitiesList;
    }
  }

  // Validate gears
  if (payload.gears !== undefined) {
    if (!Array.isArray(payload.gears)) {
      errors.gears = 'Perlengkapan harus berupa array.';
    } else {
      const gearsList: Array<{
        gearType: GearType;
        name: string;
        description?: string | null;
        sortOrder?: number;
      }> = [];

      for (let i = 0; i < payload.gears.length; i++) {
        const item = payload.gears[i];
        if (typeof item !== 'object' || item === null) {
          errors[`gears[${i}]`] = 'Item perlengkapan harus berupa object.';
          continue;
        }
        const gear = item as Record<string, unknown>;
        const gearType = gear.gearType as GearType;
        if (gearType !== 'MANDATORY' && gearType !== 'RECOMMENDED') {
          errors[`gears[${i}].gearType`] =
            'Tipe perlengkapan harus MANDATORY atau RECOMMENDED.';
        }

        if (typeof gear.name !== 'string' || gear.name.trim().length === 0) {
          errors[`gears[${i}].name`] = 'Nama perlengkapan wajib diisi.';
        } else if (gear.name.trim().length > 200) {
          errors[`gears[${i}].name`] =
            'Nama perlengkapan maksimal 200 karakter.';
        }

        let desc: string | null | undefined = undefined;
        if (typeof gear.description === 'string') {
          desc = gear.description.trim() || null;
        }

        const sortOrder =
          typeof gear.sortOrder === 'number'
            ? gear.sortOrder
            : !Number.isNaN(Number(gear.sortOrder))
              ? Number(gear.sortOrder)
              : i;

        gearsList.push({
          gearType,
          name: typeof gear.name === 'string' ? gear.name.trim() : '',
          description: desc,
          sortOrder,
        });
      }
      data.gears = gearsList;
    }
  }

  // Validate FAQs
  if (payload.faqs !== undefined) {
    if (!Array.isArray(payload.faqs)) {
      errors.faqs = 'FAQs harus berupa array.';
    } else {
      const faqsList: Array<{
        question: string;
        answer: string;
        sortOrder?: number;
        status?: ContentStatus;
      }> = [];

      for (let i = 0; i < payload.faqs.length; i++) {
        const item = payload.faqs[i];
        if (typeof item !== 'object' || item === null) {
          errors[`faqs[${i}]`] = 'Item FAQ harus berupa object.';
          continue;
        }
        const faq = item as Record<string, unknown>;

        if (
          typeof faq.question !== 'string' ||
          faq.question.trim().length === 0
        ) {
          errors[`faqs[${i}].question`] = 'Pertanyaan FAQ wajib diisi.';
        } else if (faq.question.trim().length > 5000) {
          errors[`faqs[${i}].question`] = 'Pertanyaan maksimal 5000 karakter.';
        }

        if (typeof faq.answer !== 'string' || faq.answer.trim().length === 0) {
          errors[`faqs[${i}].answer`] = 'Jawaban FAQ wajib diisi.';
        } else if (faq.answer.trim().length > 10000) {
          errors[`faqs[${i}].answer`] = 'Jawaban maksimal 10000 karakter.';
        }

        const sortOrder =
          typeof faq.sortOrder === 'number'
            ? faq.sortOrder
            : !Number.isNaN(Number(faq.sortOrder))
              ? Number(faq.sortOrder)
              : i;

        let status: ContentStatus = 'DRAFT';
        if (
          typeof faq.status === 'string' &&
          contentStatuses.has(faq.status as ContentStatus)
        ) {
          status = faq.status as ContentStatus;
        }

        faqsList.push({
          question: typeof faq.question === 'string' ? faq.question.trim() : '',
          answer: typeof faq.answer === 'string' ? faq.answer.trim() : '',
          sortOrder,
          status,
        });
      }
      data.faqs = faqsList;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
]);

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImageUpload(file: {
  filename?: string;
  mimeType?: string;
  size?: number;
}):
  | {
      valid: true;
      data: {
        filename: string;
        mimeType: string;
        size: number;
        extension: string;
      };
    }
  | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!file.filename || typeof file.filename !== 'string') {
    errors.filename = 'Nama file wajib diisi.';
  }

  const filename = file.filename || '';
  const dotIdx = filename.lastIndexOf('.');
  const ext = dotIdx >= 0 ? filename.slice(dotIdx).toLowerCase() : '';

  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    errors.extension = `Format ekstensi file "${ext}" tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.`;
  }

  if (
    !file.mimeType ||
    !ALLOWED_IMAGE_MIME_TYPES.has(file.mimeType.toLowerCase())
  ) {
    errors.mimeType = `MIME type "${file.mimeType}" tidak valid untuk berkas gambar.`;
  }

  if (typeof file.size !== 'number' || file.size <= 0) {
    errors.size = 'Ukuran berkas tidak valid.';
  } else if (file.size > MAX_IMAGE_FILE_SIZE) {
    errors.size = `Ukuran berkas melebihi batas maksimal 5MB (${Math.round(file.size / 1024 / 1024)}MB).`;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      filename,
      mimeType: file.mimeType!.toLowerCase(),
      size: file.size!,
      extension: ext,
    },
  };
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

export function validateUpdateMediaAssignment(input: unknown):
  | {
      valid: true;
      data: { coverMediaId?: string | null; galleryMediaIds?: string[] };
    }
  | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (typeof input !== 'object' || input === null) {
    return {
      valid: false,
      errors: { _global: 'Payload harus berupa object.' },
    };
  }

  const payload = input as Record<string, unknown>;
  let coverMediaId: string | null | undefined = undefined;
  const galleryMediaIds: string[] = [];

  if (payload.coverMediaId !== undefined) {
    if (payload.coverMediaId === null || payload.coverMediaId === '') {
      coverMediaId = null;
    } else if (
      typeof payload.coverMediaId === 'string' &&
      isUuid(payload.coverMediaId.trim())
    ) {
      coverMediaId = payload.coverMediaId.trim();
    } else {
      errors.coverMediaId =
        'coverMediaId harus berupa UUID yang valid atau null.';
    }
  }

  if (payload.galleryMediaIds !== undefined) {
    if (!Array.isArray(payload.galleryMediaIds)) {
      errors.galleryMediaIds =
        'galleryMediaIds harus berupa array string UUID.';
    } else {
      for (let i = 0; i < payload.galleryMediaIds.length; i++) {
        const id = payload.galleryMediaIds[i];
        if (typeof id !== 'string' || !isUuid(id.trim())) {
          errors[`galleryMediaIds[${i}]`] =
            'ID media harus berupa UUID yang valid.';
        } else {
          galleryMediaIds.push(id.trim());
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      coverMediaId,
      galleryMediaIds:
        payload.galleryMediaIds !== undefined ? galleryMediaIds : undefined,
    },
  };
}

export interface TripPublishCheckInput {
  name?: string | null;
  slug?: string | null;
  mountainId?: string | null;
  durationDays?: number | null;
  difficulty?: string | null;
  description?: string | null;
  hasCoverImage?: boolean;
  itineraryCount?: number;
}

export function validateTripPublish(trip: TripPublishCheckInput): {
  ready: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!trip.name || !trip.name.trim()) {
    errors.name = 'Nama trip wajib diisi.';
  }
  if (!trip.slug || !trip.slug.trim()) {
    errors.slug = 'Slug trip wajib diisi.';
  }
  if (!trip.mountainId) {
    errors.mountainId = 'Gunung tujuan wajib dipilih.';
  }
  if (!trip.durationDays || trip.durationDays <= 0) {
    errors.durationDays = 'Durasi hari wajib lebih dari 0.';
  }
  if (!trip.difficulty) {
    errors.difficulty = 'Tingkat kesulitan wajib ditentukan.';
  }
  if (!trip.description || !trip.description.trim()) {
    errors.description = 'Deskripsi trip wajib diisi.';
  }
  if (!trip.hasCoverImage) {
    errors.coverImage = 'Cover image wajib diisi.';
  }
  if (!trip.itineraryCount || trip.itineraryCount <= 0) {
    errors.itinerary = 'Itinerary minimal 1 hari wajib diisi.';
  }

  return {
    ready: Object.keys(errors).length === 0,
    errors,
  };
}

const VALID_SCHEDULE_STATUSES = new Set<ScheduleStatus>([
  'DRAFT',
  'OPEN',
  'CLOSED',
  'CANCELLED',
  'COMPLETED',
]);

export function computeAvailability(
  capacity: number,
  confirmedSeats: number,
): {
  availableSeats: number;
  availabilityStatus: AvailabilityStatus;
} {
  const availableSeats = Math.max(0, capacity - confirmedSeats);
  let availabilityStatus: AvailabilityStatus = 'AVAILABLE';
  if (availableSeats <= 0) {
    availabilityStatus = 'SOLD_OUT';
  } else if (
    availableSeats <= 3 ||
    (capacity > 0 && availableSeats / capacity <= 0.2)
  ) {
    availabilityStatus = 'ALMOST_FULL';
  }
  return { availableSeats, availabilityStatus };
}

export function validateCreateSchedule(
  payload: unknown,
): ValidationResult<CreateSchedulePayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // tripId
  if (
    !data.tripId ||
    typeof data.tripId !== 'string' ||
    !uuidRegex.test(data.tripId)
  ) {
    errors.tripId = 'tripId harus berupa UUID yang valid.';
  }

  // startDate
  if (
    !data.startDate ||
    typeof data.startDate !== 'string' ||
    isNaN(Date.parse(data.startDate))
  ) {
    errors.startDate = 'startDate harus berupa format tanggal yang valid.';
  }

  // endDate
  if (
    !data.endDate ||
    typeof data.endDate !== 'string' ||
    isNaN(Date.parse(data.endDate))
  ) {
    errors.endDate = 'endDate harus berupa format tanggal yang valid.';
  } else if (
    typeof data.startDate === 'string' &&
    !isNaN(Date.parse(data.startDate))
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.endDate = 'endDate tidak boleh mendahului startDate.';
    }
  }

  // registrationDeadline
  let registrationDeadline: string | null | undefined = undefined;
  if (
    data.registrationDeadline !== undefined &&
    data.registrationDeadline !== null
  ) {
    if (
      typeof data.registrationDeadline !== 'string' ||
      isNaN(Date.parse(data.registrationDeadline))
    ) {
      errors.registrationDeadline =
        'registrationDeadline harus berupa format tanggal/waktu yang valid.';
    } else {
      registrationDeadline = data.registrationDeadline;
      if (
        typeof data.startDate === 'string' &&
        !isNaN(Date.parse(data.startDate))
      ) {
        const start = new Date(data.startDate);
        const deadline = new Date(data.registrationDeadline);
        if (deadline > start) {
          errors.registrationDeadline =
            'registrationDeadline tidak boleh melebihi startDate.';
        }
      }
    }
  } else if (data.registrationDeadline === null) {
    registrationDeadline = null;
  }

  // capacity
  if (
    typeof data.capacity !== 'number' ||
    !Number.isInteger(data.capacity) ||
    data.capacity <= 0
  ) {
    errors.capacity =
      'capacity harus berupa bilangan bulat lebih besar dari 0.';
  }

  // minimumParticipants
  let minimumParticipants: number | null | undefined = undefined;
  if (
    data.minimumParticipants !== undefined &&
    data.minimumParticipants !== null
  ) {
    if (
      typeof data.minimumParticipants !== 'number' ||
      !Number.isInteger(data.minimumParticipants) ||
      data.minimumParticipants <= 0
    ) {
      errors.minimumParticipants =
        'minimumParticipants harus berupa bilangan bulat lebih besar dari 0.';
    } else if (
      typeof data.capacity === 'number' &&
      data.minimumParticipants > data.capacity
    ) {
      errors.minimumParticipants =
        'minimumParticipants tidak boleh melebihi capacity.';
    } else {
      minimumParticipants = data.minimumParticipants;
    }
  } else if (data.minimumParticipants === null) {
    minimumParticipants = null;
  }

  // notes
  let notes: string | null | undefined = undefined;
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.notes = 'notes harus berupa string.';
    } else {
      notes = data.notes.trim();
    }
  } else if (data.notes === null) {
    notes = null;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      tripId: data.tripId as string,
      startDate: data.startDate as string,
      endDate: data.endDate as string,
      registrationDeadline,
      capacity: data.capacity as number,
      minimumParticipants,
      notes,
    },
  };
}

export function validateUpdateSchedule(
  payload: unknown,
): ValidationResult<UpdateSchedulePayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdateSchedulePayload = {};

  if (data.startDate !== undefined) {
    if (
      typeof data.startDate !== 'string' ||
      isNaN(Date.parse(data.startDate))
    ) {
      errors.startDate = 'startDate harus berupa format tanggal yang valid.';
    } else {
      result.startDate = data.startDate;
    }
  }

  if (data.endDate !== undefined) {
    if (typeof data.endDate !== 'string' || isNaN(Date.parse(data.endDate))) {
      errors.endDate = 'endDate harus berupa format tanggal yang valid.';
    } else {
      result.endDate = data.endDate;
    }
  }

  if (result.startDate && result.endDate) {
    if (new Date(result.endDate) < new Date(result.startDate)) {
      errors.endDate = 'endDate tidak boleh mendahului startDate.';
    }
  }

  if (data.registrationDeadline !== undefined) {
    if (data.registrationDeadline === null) {
      result.registrationDeadline = null;
    } else if (
      typeof data.registrationDeadline !== 'string' ||
      isNaN(Date.parse(data.registrationDeadline))
    ) {
      errors.registrationDeadline =
        'registrationDeadline harus berupa format tanggal/waktu yang valid.';
    } else {
      result.registrationDeadline = data.registrationDeadline;
    }
  }

  if (data.capacity !== undefined) {
    if (
      typeof data.capacity !== 'number' ||
      !Number.isInteger(data.capacity) ||
      data.capacity <= 0
    ) {
      errors.capacity =
        'capacity harus berupa bilangan bulat lebih besar dari 0.';
    } else {
      result.capacity = data.capacity;
    }
  }

  if (data.minimumParticipants !== undefined) {
    if (data.minimumParticipants === null) {
      result.minimumParticipants = null;
    } else if (
      typeof data.minimumParticipants !== 'number' ||
      !Number.isInteger(data.minimumParticipants) ||
      data.minimumParticipants <= 0
    ) {
      errors.minimumParticipants =
        'minimumParticipants harus berupa bilangan bulat lebih besar dari 0.';
    } else {
      result.minimumParticipants = data.minimumParticipants;
    }
  }

  if (data.status !== undefined) {
    if (
      typeof data.status !== 'string' ||
      !VALID_SCHEDULE_STATUSES.has(data.status as ScheduleStatus)
    ) {
      errors.status = `status tidak valid. Pilihan: ${Array.from(VALID_SCHEDULE_STATUSES).join(', ')}.`;
    } else {
      result.status = data.status as ScheduleStatus;
    }
  }

  if (data.notes !== undefined) {
    if (data.notes === null) {
      result.notes = null;
    } else if (typeof data.notes !== 'string') {
      errors.notes = 'notes harus berupa string.';
    } else {
      result.notes = data.notes.trim();
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateScheduleQuery(
  query: Record<string, unknown>,
): ScheduleQueryPayload {
  const result: ScheduleQueryPayload = {};

  if (typeof query.tripId === 'string' && query.tripId.trim()) {
    result.tripId = query.tripId.trim();
  }

  if (
    typeof query.status === 'string' &&
    VALID_SCHEDULE_STATUSES.has(query.status as ScheduleStatus)
  ) {
    result.status = query.status as ScheduleStatus;
  }

  if (typeof query.fromDate === 'string' && query.fromDate.trim()) {
    result.fromDate = query.fromDate.trim();
  }

  if (typeof query.toDate === 'string' && query.toDate.trim()) {
    result.toDate = query.toDate.trim();
  }

  const page = Number(query.page);
  result.page = Number.isInteger(page) && page > 0 ? page : 1;

  const pageSize = Number(query.pageSize);
  result.pageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

  return result;
}

const VALID_ENTITY_STATUSES = new Set<EntityStatus>(['ACTIVE', 'INACTIVE']);

export function validateCreateMeetingPoint(
  payload: unknown,
): ValidationResult<CreateMeetingPointPayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Nama titik temu (meeting point) wajib diisi.';
  } else if (data.name.trim().length > 180) {
    errors.name = 'Nama titik temu maksimal 180 karakter.';
  }

  let city: string | null | undefined = undefined;
  if (data.city !== undefined && data.city !== null) {
    if (typeof data.city !== 'string') {
      errors.city = 'Kota harus berupa string.';
    } else {
      city = data.city.trim() || null;
    }
  }

  let address: string | null | undefined = undefined;
  if (data.address !== undefined && data.address !== null) {
    if (typeof data.address !== 'string') {
      errors.address = 'Alamat harus berupa string.';
    } else {
      address = data.address.trim() || null;
    }
  }

  let latitude: number | null | undefined = undefined;
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude harus di antara -90 dan 90.';
    } else {
      latitude = lat;
    }
  }

  let longitude: number | null | undefined = undefined;
  if (data.longitude !== undefined && data.longitude !== null) {
    const lng = Number(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude harus di antara -180 dan 180.';
    } else {
      longitude = lng;
    }
  }

  let notes: string | null | undefined = undefined;
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      errors.notes = 'Catatan harus berupa string.';
    } else {
      notes = data.notes.trim() || null;
    }
  }

  let status: EntityStatus | undefined = undefined;
  if (data.status !== undefined && data.status !== null) {
    if (
      typeof data.status !== 'string' ||
      !VALID_ENTITY_STATUSES.has(data.status as EntityStatus)
    ) {
      errors.status = 'Status harus berupa ACTIVE atau INACTIVE.';
    } else {
      status = data.status as EntityStatus;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: (data.name as string).trim(),
      city,
      address,
      latitude,
      longitude,
      notes,
      status: status || 'ACTIVE',
    },
  };
}

export function validateUpdateMeetingPoint(
  payload: unknown,
): ValidationResult<UpdateMeetingPointPayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdateMeetingPointPayload = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      errors.name = 'Nama titik temu (meeting point) tidak boleh kosong.';
    } else if (data.name.trim().length > 180) {
      errors.name = 'Nama titik temu maksimal 180 karakter.';
    } else {
      result.name = data.name.trim();
    }
  }

  if (data.city !== undefined) {
    if (data.city === null) {
      result.city = null;
    } else if (typeof data.city !== 'string') {
      errors.city = 'Kota harus berupa string.';
    } else {
      result.city = data.city.trim() || null;
    }
  }

  if (data.address !== undefined) {
    if (data.address === null) {
      result.address = null;
    } else if (typeof data.address !== 'string') {
      errors.address = 'Alamat harus berupa string.';
    } else {
      result.address = data.address.trim() || null;
    }
  }

  if (data.latitude !== undefined) {
    if (data.latitude === null) {
      result.latitude = null;
    } else {
      const lat = Number(data.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude harus di antara -90 dan 90.';
      } else {
        result.latitude = lat;
      }
    }
  }

  if (data.longitude !== undefined) {
    if (data.longitude === null) {
      result.longitude = null;
    } else {
      const lng = Number(data.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude harus di antara -180 dan 180.';
      } else {
        result.longitude = lng;
      }
    }
  }

  if (data.notes !== undefined) {
    if (data.notes === null) {
      result.notes = null;
    } else if (typeof data.notes !== 'string') {
      errors.notes = 'Catatan harus berupa string.';
    } else {
      result.notes = data.notes.trim() || null;
    }
  }

  if (data.status !== undefined) {
    if (
      typeof data.status !== 'string' ||
      !VALID_ENTITY_STATUSES.has(data.status as EntityStatus)
    ) {
      errors.status = 'Status harus berupa ACTIVE atau INACTIVE.';
    } else {
      result.status = data.status as EntityStatus;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateCreatePackage(
  payload: unknown,
): ValidationResult<CreatePackagePayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // CRITICAL RULE 84: Package must NOT have capacity or available_seats
  if (
    data.capacity !== undefined ||
    data.available_seats !== undefined ||
    data.availableSeats !== undefined
  ) {
    errors.capacity =
      'Package must NOT have capacity or available_seats. Capacity belongs to schedule.';
  }

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Nama paket wajib diisi.';
  } else if (data.name.trim().length > 180) {
    errors.name = 'Nama paket maksimal 180 karakter.';
  }

  if (
    data.price === undefined ||
    data.price === null ||
    typeof data.price !== 'number' ||
    data.price < 0 ||
    isNaN(data.price)
  ) {
    errors.price = 'Harga paket (price) wajib berupa angka positif atau 0.';
  }

  let meetingPointId: string | null | undefined = undefined;
  if (data.meetingPointId !== undefined && data.meetingPointId !== null) {
    if (
      typeof data.meetingPointId !== 'string' ||
      !uuidRegex.test(data.meetingPointId)
    ) {
      errors.meetingPointId = 'meetingPointId harus berupa UUID yang valid.';
    } else {
      meetingPointId = data.meetingPointId;
    }
  }

  let meetingDatetime: string | null | undefined = undefined;
  if (data.meetingDatetime !== undefined && data.meetingDatetime !== null) {
    if (
      typeof data.meetingDatetime !== 'string' ||
      isNaN(Date.parse(data.meetingDatetime))
    ) {
      errors.meetingDatetime =
        'meetingDatetime harus berupa format tanggal/waktu yang valid.';
    } else {
      meetingDatetime = data.meetingDatetime;
    }
  }

  let status: EntityStatus | undefined = undefined;
  if (data.status !== undefined && data.status !== null) {
    if (
      typeof data.status !== 'string' ||
      !VALID_ENTITY_STATUSES.has(data.status as EntityStatus)
    ) {
      errors.status = 'Status harus berupa ACTIVE atau INACTIVE.';
    } else {
      status = data.status as EntityStatus;
    }
  }

  let sortOrder: number | undefined = undefined;
  if (data.sortOrder !== undefined && data.sortOrder !== null) {
    const order = Number(data.sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      errors.sortOrder = 'sortOrder harus berupa bilangan bulat non-negatif.';
    } else {
      sortOrder = order;
    }
  }

  let description: string | null | undefined = undefined;
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.description = 'Deskripsi harus berupa string.';
    } else {
      description = data.description.trim() || null;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: (data.name as string).trim(),
      description,
      price: data.price as number,
      meetingPointId,
      meetingDatetime,
      status: status || 'ACTIVE',
      sortOrder: sortOrder !== undefined ? sortOrder : 0,
    },
  };
}

export function validateUpdatePackage(
  payload: unknown,
): ValidationResult<UpdatePackagePayload> {
  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object.' },
    };
  }

  const data = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdatePackagePayload = {};

  // CRITICAL RULE 84: Package must NOT have capacity or available_seats
  if (
    data.capacity !== undefined ||
    data.available_seats !== undefined ||
    data.availableSeats !== undefined
  ) {
    errors.capacity =
      'Package must NOT have capacity or available_seats. Capacity belongs to schedule.';
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      errors.name = 'Nama paket tidak boleh kosong.';
    } else if (data.name.trim().length > 180) {
      errors.name = 'Nama paket maksimal 180 karakter.';
    } else {
      result.name = data.name.trim();
    }
  }

  if (data.price !== undefined) {
    if (typeof data.price !== 'number' || data.price < 0 || isNaN(data.price)) {
      errors.price = 'Harga paket (price) harus berupa angka positif atau 0.';
    } else {
      result.price = data.price;
    }
  }

  if (data.meetingPointId !== undefined) {
    if (data.meetingPointId === null) {
      result.meetingPointId = null;
    } else if (
      typeof data.meetingPointId !== 'string' ||
      !uuidRegex.test(data.meetingPointId)
    ) {
      errors.meetingPointId = 'meetingPointId harus berupa UUID yang valid.';
    } else {
      result.meetingPointId = data.meetingPointId;
    }
  }

  if (data.meetingDatetime !== undefined) {
    if (data.meetingDatetime === null) {
      result.meetingDatetime = null;
    } else if (
      typeof data.meetingDatetime !== 'string' ||
      isNaN(Date.parse(data.meetingDatetime))
    ) {
      errors.meetingDatetime =
        'meetingDatetime harus berupa format tanggal/waktu yang valid.';
    } else {
      result.meetingDatetime = data.meetingDatetime;
    }
  }

  if (data.status !== undefined) {
    if (
      typeof data.status !== 'string' ||
      !VALID_ENTITY_STATUSES.has(data.status as EntityStatus)
    ) {
      errors.status = 'Status harus berupa ACTIVE atau INACTIVE.';
    } else {
      result.status = data.status as EntityStatus;
    }
  }

  if (data.sortOrder !== undefined) {
    const order = Number(data.sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      errors.sortOrder = 'sortOrder harus berupa bilangan bulat non-negatif.';
    } else {
      result.sortOrder = order;
    }
  }

  if (data.description !== undefined) {
    if (data.description === null) {
      result.description = null;
    } else if (typeof data.description !== 'string') {
      errors.description = 'Deskripsi harus berupa string.';
    } else {
      result.description = data.description.trim() || null;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

// ==========================================
// PUBLIC QUERY VALIDATORS (STEP 17)
// ==========================================

export function validatePublicTripQuery(
  query: Record<string, unknown>,
): PublicTripQuery {
  const result: PublicTripQuery = {};

  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    result.search = query.search.trim();
  }

  if (
    typeof query.month === 'string' &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month.trim())
  ) {
    result.month = query.month.trim();
  }

  if (
    typeof query.type === 'string' &&
    ['OPEN_TRIP', 'PRIVATE_TRIP', 'CUSTOM_TRIP'].includes(query.type)
  ) {
    result.type = query.type as TripType;
  }

  if (
    typeof query.difficulty === 'string' &&
    ['EASY', 'MODERATE', 'HARD', 'EXTREME'].includes(query.difficulty)
  ) {
    result.difficulty = query.difficulty as DifficultyLevel;
  }

  if (
    typeof query.availability === 'string' &&
    ['AVAILABLE', 'ALMOST_FULL', 'SOLD_OUT'].includes(query.availability)
  ) {
    result.availability = query.availability as AvailabilityStatus;
  }

  if (typeof query.mountain === 'string' && query.mountain.trim().length > 0) {
    result.mountain = query.mountain.trim();
  }

  if (
    typeof query.destination === 'string' &&
    query.destination.trim().length > 0
  ) {
    result.destination = query.destination.trim();
  }

  const page = Number(query.page);
  result.page = Number.isInteger(page) && page > 0 ? page : 1;

  const pageSize = Number(query.pageSize);
  result.pageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

  if (typeof query.sort === 'string' && query.sort.trim().length > 0) {
    result.sort = query.sort.trim();
  }

  if (query.order === 'asc' || query.order === 'desc') {
    result.order = query.order;
  }

  return result;
}

export function validatePublicMountainQuery(
  query: Record<string, unknown>,
): PublicMountainQuery {
  const result: PublicMountainQuery = {};

  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    result.search = query.search.trim();
  }

  if (
    typeof query.destination === 'string' &&
    query.destination.trim().length > 0
  ) {
    result.destination = query.destination.trim();
  }

  if (
    typeof query.difficulty === 'string' &&
    ['EASY', 'MODERATE', 'HARD', 'EXTREME'].includes(query.difficulty)
  ) {
    result.difficulty = query.difficulty as DifficultyLevel;
  }

  const page = Number(query.page);
  result.page = Number.isInteger(page) && page > 0 ? page : 1;

  const pageSize = Number(query.pageSize);
  result.pageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

  return result;
}

export interface BookingWhatsAppParams {
  tripName: string;
  scheduleDates: string;
  packageName: string;
  priceFormatted: string;
}

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('08')) {
    return '62' + digits.slice(1);
  }
  return digits || '6281234567890';
}

export function buildBookingWhatsAppMessage(
  params: BookingWhatsAppParams,
): string {
  return [
    'Halo Wildera Adventure 👋',
    '',
    'Saya tertarik dengan:',
    '',
    `Trip: ${params.tripName}`,
    `Jadwal: ${params.scheduleDates}`,
    `Paket: ${params.packageName}`,
    `Harga: ${params.priceFormatted}`,
    '',
    'Mohon info untuk proses booking selanjutnya.',
  ].join('\n');
}

export function buildHealthRequirementWhatsAppMessage(
  tripName: string,
): string {
  return [
    'Halo Wildera Adventure 👋',
    '',
    `Saya ingin berkonsultasi mengenai persyaratan surat keterangan sehat untuk trip: ${tripName}.`,
    '',
    'Mohon panduan untuk proses dan dokumen yang diperlukan.',
  ].join('\n');
}

export function buildGlobalWhatsAppMessage(): string {
  return [
    'Halo Wildera Adventure 👋',
    '',
    'Saya ingin bertanya mengenai jadwal trip pendakian dan ekspedisi alam terbuka Wildera.',
  ].join('\n');
}

export function buildPrivateTripWhatsAppMessage(
  destinationOrMountain?: string,
): string {
  const target = destinationOrMountain ? ` untuk ${destinationOrMountain}` : '';
  return [
    'Halo Wildera Adventure 👋',
    '',
    `Saya tertarik untuk konsultasi pembuatan Private Trip${target}.`,
    '',
    'Mohon info ketersediaan tanggal, opsi rute, dan estimasi penawarannya.',
  ].join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = normalizePhoneNumber(phoneNumber);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

const BOOKING_SOURCES: readonly BookingSource[] = [
  'WEBSITE_WHATSAPP',
  'WHATSAPP',
  'INSTAGRAM',
  'ADMIN',
  'OTHER',
];

const BOOKING_STATUSES: readonly BookingStatus[] = [
  'INQUIRY',
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
];

const emailFormatRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateBooking(
  body: unknown,
): ValidationResult<CreateBookingPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Payload booking harus berupa object.' },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (typeof data.scheduleId !== 'string' || !uuidRegex.test(data.scheduleId)) {
    errors.scheduleId = 'scheduleId wajib berupa UUID valid.';
  }

  if (typeof data.packageId !== 'string' || !uuidRegex.test(data.packageId)) {
    errors.packageId = 'packageId wajib berupa UUID valid.';
  }

  if (
    typeof data.contactName !== 'string' ||
    data.contactName.trim().length < 2
  ) {
    errors.contactName = 'contactName wajib diisi minimal 2 karakter.';
  } else if (data.contactName.trim().length > 180) {
    errors.contactName = 'contactName maksimal 180 karakter.';
  }

  if (
    typeof data.contactWhatsapp !== 'string' ||
    data.contactWhatsapp.trim().length < 8
  ) {
    errors.contactWhatsapp =
      'contactWhatsapp wajib diisi nomor WhatsApp valid.';
  }

  const rawWhatsapp =
    typeof data.contactWhatsapp === 'string' ? data.contactWhatsapp : '';
  const normalizedWhatsapp = normalizePhoneNumber(rawWhatsapp);
  if (normalizedWhatsapp.length > 30) {
    errors.contactWhatsapp = 'contactWhatsapp maksimal 30 karakter.';
  }

  let contactEmail: string | null = null;
  if (
    data.contactEmail !== undefined &&
    data.contactEmail !== null &&
    data.contactEmail !== ''
  ) {
    if (
      typeof data.contactEmail !== 'string' ||
      !emailFormatRegex.test(data.contactEmail)
    ) {
      errors.contactEmail =
        'contactEmail harus berupa format email yang valid.';
    } else {
      contactEmail = data.contactEmail.trim().toLowerCase();
    }
  }

  if (
    typeof data.source !== 'string' ||
    !BOOKING_SOURCES.includes(data.source as BookingSource)
  ) {
    errors.source = `source harus salah satu dari: ${BOOKING_SOURCES.join(', ')}.`;
  }

  const participantCount = Number(data.participantCount);
  if (!Number.isInteger(participantCount) || participantCount < 1) {
    errors.participantCount =
      'participantCount wajib berupa bilangan bulat minimal 1.';
  } else if (participantCount > 500) {
    errors.participantCount = 'participantCount maksimal 500 peserta.';
  }

  let totalAmount: number | undefined;
  if (data.totalAmount !== undefined && data.totalAmount !== null) {
    const parsedAmount = Number(data.totalAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      errors.totalAmount = 'totalAmount tidak boleh bernilai negatif.';
    } else {
      totalAmount = parsedAmount;
    }
  }

  let status: BookingStatus = 'INQUIRY';
  if (data.status !== undefined && data.status !== null) {
    if (
      typeof data.status !== 'string' ||
      !BOOKING_STATUSES.includes(data.status as BookingStatus)
    ) {
      errors.status = `status harus salah satu dari: ${BOOKING_STATUSES.join(', ')}.`;
    } else {
      status = data.status as BookingStatus;
    }
  }

  let notes: string | null = null;
  if (typeof data.notes === 'string') {
    notes = data.notes.trim() || null;
  }

  let participants: CreateBookingPayload['participants'];
  if (Array.isArray(data.participants)) {
    participants = [];
    for (let idx = 0; idx < data.participants.length; idx++) {
      const p = data.participants[idx];
      if (!p || typeof p !== 'object') {
        errors[`participants.${idx}`] =
          `Peserta index ${idx} harus berupa object.`;
        continue;
      }
      const participant = p as Record<string, unknown>;
      if (
        typeof participant.fullName !== 'string' ||
        participant.fullName.trim().length < 2
      ) {
        errors[`participants.${idx}.fullName`] =
          `Nama peserta index ${idx} wajib minimal 2 karakter.`;
      }
      participants.push({
        fullName:
          typeof participant.fullName === 'string'
            ? participant.fullName.trim()
            : '',
        dateOfBirth:
          typeof participant.dateOfBirth === 'string'
            ? participant.dateOfBirth
            : null,
        gender:
          participant.gender === 'MALE' || participant.gender === 'FEMALE'
            ? participant.gender
            : null,
        phone:
          typeof participant.phone === 'string'
            ? participant.phone.trim()
            : null,
        identityType:
          participant.identityType === 'KTP' ||
          participant.identityType === 'PASSPORT' ||
          participant.identityType === 'OTHER'
            ? participant.identityType
            : null,
        identityNumber:
          typeof participant.identityNumber === 'string'
            ? participant.identityNumber.trim()
            : null,
        emergencyContactName:
          typeof participant.emergencyContactName === 'string'
            ? participant.emergencyContactName.trim()
            : null,
        emergencyContactPhone:
          typeof participant.emergencyContactPhone === 'string'
            ? participant.emergencyContactPhone.trim()
            : null,
        notes:
          typeof participant.notes === 'string'
            ? participant.notes.trim()
            : null,
      });
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      scheduleId: data.scheduleId as string,
      packageId: data.packageId as string,
      contactName: (data.contactName as string).trim(),
      contactWhatsapp: normalizedWhatsapp,
      contactEmail,
      source: data.source as BookingSource,
      participantCount,
      totalAmount,
      status,
      notes,
      participants,
    },
  };
}

export function validateUpdateBooking(
  body: unknown,
): ValidationResult<UpdateBookingPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Payload update booking harus berupa object.' },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdateBookingPayload = {};
  let hasField = false;

  if (data.contactName !== undefined) {
    if (
      typeof data.contactName !== 'string' ||
      data.contactName.trim().length < 2
    ) {
      errors.contactName = 'contactName wajib minimal 2 karakter.';
    } else {
      result.contactName = data.contactName.trim();
      hasField = true;
    }
  }

  if (data.contactWhatsapp !== undefined) {
    if (
      typeof data.contactWhatsapp !== 'string' ||
      data.contactWhatsapp.trim().length < 8
    ) {
      errors.contactWhatsapp =
        'contactWhatsapp wajib berupa nomor telepon valid.';
    } else {
      result.contactWhatsapp = normalizePhoneNumber(data.contactWhatsapp);
      hasField = true;
    }
  }

  if (data.contactEmail !== undefined) {
    if (data.contactEmail === null || data.contactEmail === '') {
      result.contactEmail = null;
      hasField = true;
    } else {
      if (
        typeof data.contactEmail !== 'string' ||
        !emailFormatRegex.test(data.contactEmail)
      ) {
        errors.contactEmail =
          'contactEmail harus berupa format email yang valid.';
      } else {
        result.contactEmail = data.contactEmail.trim().toLowerCase();
        hasField = true;
      }
    }
  }

  if (data.participantCount !== undefined) {
    const participantCount = Number(data.participantCount);
    if (!Number.isInteger(participantCount) || participantCount < 1) {
      errors.participantCount =
        'participantCount harus bilangan bulat minimal 1.';
    } else {
      result.participantCount = participantCount;
      hasField = true;
    }
  }

  if (data.totalAmount !== undefined) {
    if (data.totalAmount === null) {
      result.totalAmount = undefined;
      hasField = true;
    } else {
      const parsed = Number(data.totalAmount);
      if (isNaN(parsed) || parsed < 0) {
        errors.totalAmount = 'totalAmount tidak boleh negatif.';
      } else {
        result.totalAmount = parsed;
        hasField = true;
      }
    }
  }

  if (data.notes !== undefined) {
    result.notes =
      typeof data.notes === 'string' ? data.notes.trim() || null : null;
    hasField = true;
  }

  if (data.cancellationReason !== undefined) {
    result.cancellationReason =
      typeof data.cancellationReason === 'string'
        ? data.cancellationReason.trim() || null
        : null;
    hasField = true;
  }

  if (data.status !== undefined) {
    if (
      typeof data.status !== 'string' ||
      !BOOKING_STATUSES.includes(data.status as BookingStatus)
    ) {
      errors.status = `status harus salah satu dari: ${BOOKING_STATUSES.join(', ')}.`;
    } else {
      result.status = data.status as BookingStatus;
      hasField = true;
    }
  }

  if (!hasField && Object.keys(errors).length === 0) {
    return {
      valid: false,
      errors: {
        body: 'Payload update booking minimal harus memiliki satu field yang diubah.',
      },
    };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateCancelBooking(
  body: unknown,
): ValidationResult<CancelBookingPayload> {
  if (!body || typeof body !== 'object') {
    return { valid: true, data: { cancellationReason: null } };
  }

  const data = body as Record<string, unknown>;
  let cancellationReason: string | null = null;
  if (typeof data.cancellationReason === 'string') {
    cancellationReason = data.cancellationReason.trim() || null;
  }

  return { valid: true, data: { cancellationReason } };
}

export function validateBookingQuery(
  query: Record<string, unknown>,
): BookingQuery {
  const result: BookingQuery = {};

  if (typeof query.search === 'string' && query.search.trim()) {
    result.search = query.search.trim();
  }

  if (
    typeof query.status === 'string' &&
    BOOKING_STATUSES.includes(query.status as BookingStatus)
  ) {
    result.status = query.status as BookingStatus;
  }

  if (
    typeof query.scheduleId === 'string' &&
    uuidRegex.test(query.scheduleId)
  ) {
    result.scheduleId = query.scheduleId;
  }

  if (typeof query.tripId === 'string' && uuidRegex.test(query.tripId)) {
    result.tripId = query.tripId;
  }

  if (
    typeof query.source === 'string' &&
    BOOKING_SOURCES.includes(query.source as BookingSource)
  ) {
    result.source = query.source as BookingSource;
  }

  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') {
    result.sortOrder = query.sortOrder;
  }

  const page = Number(query.page);
  result.page = Number.isInteger(page) && page > 0 ? page : 1;

  const pageSize = Number(query.pageSize);
  result.pageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

  return result;
}

export function validateCreateParticipant(
  body: unknown,
): ValidationResult<CreateParticipantPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Payload peserta harus berupa object.' },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
    errors.fullName = 'Nama lengkap peserta wajib diisi minimal 2 karakter.';
  } else if (data.fullName.trim().length > 180) {
    errors.fullName = 'Nama lengkap peserta maksimal 180 karakter.';
  }

  let dateOfBirth: string | Date | null = null;
  if (
    data.dateOfBirth !== undefined &&
    data.dateOfBirth !== null &&
    data.dateOfBirth !== ''
  ) {
    const d = new Date(String(data.dateOfBirth));
    if (isNaN(d.getTime())) {
      errors.dateOfBirth = 'Format tanggal lahir tidak valid.';
    } else {
      dateOfBirth = d;
    }
  }

  let gender: 'MALE' | 'FEMALE' | null = null;
  if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
    if (data.gender === 'MALE' || data.gender === 'FEMALE') {
      gender = data.gender;
    } else {
      errors.gender = 'Gender harus bernilai MALE atau FEMALE.';
    }
  }

  let phone: string | null = null;
  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    const raw = String(data.phone).trim();
    if (raw.length < 8 || raw.length > 30) {
      errors.phone = 'Nomor telepon minimal 8 dan maksimal 30 karakter.';
    } else {
      phone = raw;
    }
  }

  let identityType: 'KTP' | 'PASSPORT' | 'OTHER' | null = null;
  if (
    data.identityType !== undefined &&
    data.identityType !== null &&
    data.identityType !== ''
  ) {
    if (
      data.identityType === 'KTP' ||
      data.identityType === 'PASSPORT' ||
      data.identityType === 'OTHER'
    ) {
      identityType = data.identityType;
    } else {
      errors.identityType =
        'Jenis identitas harus bernilai KTP, PASSPORT, atau OTHER.';
    }
  }

  let identityNumber: string | null = null;
  if (
    data.identityNumber !== undefined &&
    data.identityNumber !== null &&
    data.identityNumber !== ''
  ) {
    const idNum = String(data.identityNumber).trim();
    if (idNum.length > 100) {
      errors.identityNumber = 'Nomor identitas maksimal 100 karakter.';
    } else {
      identityNumber = idNum;
    }
  }

  let emergencyContactName: string | null = null;
  if (
    data.emergencyContactName !== undefined &&
    data.emergencyContactName !== null &&
    data.emergencyContactName !== ''
  ) {
    const eName = String(data.emergencyContactName).trim();
    if (eName.length > 180) {
      errors.emergencyContactName =
        'Nama kontak darurat maksimal 180 karakter.';
    } else {
      emergencyContactName = eName;
    }
  }

  let emergencyContactPhone: string | null = null;
  if (
    data.emergencyContactPhone !== undefined &&
    data.emergencyContactPhone !== null &&
    data.emergencyContactPhone !== ''
  ) {
    const ePhone = String(data.emergencyContactPhone).trim();
    if (ePhone.length > 30) {
      errors.emergencyContactPhone =
        'Nomor kontak darurat maksimal 30 karakter.';
    } else {
      emergencyContactPhone = ePhone;
    }
  }

  const notes =
    data.notes !== undefined && data.notes !== null && data.notes !== ''
      ? String(data.notes).trim()
      : null;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      fullName: (data.fullName as string).trim(),
      dateOfBirth,
      gender,
      phone,
      identityType,
      identityNumber,
      emergencyContactName,
      emergencyContactPhone,
      notes,
    },
  };
}

export function validateUpdateParticipant(
  body: unknown,
): ValidationResult<UpdateParticipantPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Payload update peserta harus berupa object.' },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdateParticipantPayload = {};

  if (data.fullName !== undefined) {
    if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
      errors.fullName = 'Nama lengkap peserta minimal 2 karakter.';
    } else if (data.fullName.trim().length > 180) {
      errors.fullName = 'Nama lengkap peserta maksimal 180 karakter.';
    } else {
      result.fullName = data.fullName.trim();
    }
  }

  if (data.dateOfBirth !== undefined) {
    if (data.dateOfBirth === null || data.dateOfBirth === '') {
      result.dateOfBirth = null;
    } else {
      const d = new Date(String(data.dateOfBirth));
      if (isNaN(d.getTime())) {
        errors.dateOfBirth = 'Format tanggal lahir tidak valid.';
      } else {
        result.dateOfBirth = d;
      }
    }
  }

  if (data.gender !== undefined) {
    if (data.gender === null || data.gender === '') {
      result.gender = null;
    } else if (data.gender === 'MALE' || data.gender === 'FEMALE') {
      result.gender = data.gender;
    } else {
      errors.gender = 'Gender harus bernilai MALE atau FEMALE.';
    }
  }

  if (data.phone !== undefined) {
    if (data.phone === null || data.phone === '') {
      result.phone = null;
    } else {
      const raw = String(data.phone).trim();
      if (raw.length < 8 || raw.length > 30) {
        errors.phone = 'Nomor telepon minimal 8 dan maksimal 30 karakter.';
      } else {
        result.phone = raw;
      }
    }
  }

  if (data.identityType !== undefined) {
    if (data.identityType === null || data.identityType === '') {
      result.identityType = null;
    } else if (
      data.identityType === 'KTP' ||
      data.identityType === 'PASSPORT' ||
      data.identityType === 'OTHER'
    ) {
      result.identityType = data.identityType;
    } else {
      errors.identityType =
        'Jenis identitas harus bernilai KTP, PASSPORT, atau OTHER.';
    }
  }

  if (data.identityNumber !== undefined) {
    if (data.identityNumber === null || data.identityNumber === '') {
      result.identityNumber = null;
    } else {
      const idNum = String(data.identityNumber).trim();
      if (idNum.length > 100) {
        errors.identityNumber = 'Nomor identitas maksimal 100 karakter.';
      } else {
        result.identityNumber = idNum;
      }
    }
  }

  if (data.emergencyContactName !== undefined) {
    if (
      data.emergencyContactName === null ||
      data.emergencyContactName === ''
    ) {
      result.emergencyContactName = null;
    } else {
      const eName = String(data.emergencyContactName).trim();
      if (eName.length > 180) {
        errors.emergencyContactName =
          'Nama kontak darurat maksimal 180 karakter.';
      } else {
        result.emergencyContactName = eName;
      }
    }
  }

  if (data.emergencyContactPhone !== undefined) {
    if (
      data.emergencyContactPhone === null ||
      data.emergencyContactPhone === ''
    ) {
      result.emergencyContactPhone = null;
    } else {
      const ePhone = String(data.emergencyContactPhone).trim();
      if (ePhone.length > 30) {
        errors.emergencyContactPhone =
          'Nomor kontak darurat maksimal 30 karakter.';
      } else {
        result.emergencyContactPhone = ePhone;
      }
    }
  }

  if (data.notes !== undefined) {
    result.notes =
      data.notes === null || data.notes === ''
        ? null
        : String(data.notes).trim();
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

const PRIVATE_TRIP_STATUSES = new Set<PrivateTripStatus>([
  'NEW',
  'CONTACTED',
  'QUOTATION_SENT',
  'NEGOTIATION',
  'BOOKED',
  'LOST',
]);

export function validateCreatePrivateTripInquiry(
  body: unknown,
): ValidationResult<CreatePrivateTripInquiryPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Payload permintaan private trip harus berupa object.' },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const customerName = data.customerName || data.name;
  if (typeof customerName !== 'string' || customerName.trim().length < 2) {
    errors.customerName = 'Nama pemesan minimal 2 karakter.';
  } else if (customerName.trim().length > 180) {
    errors.customerName = 'Nama pemesan maksimal 180 karakter.';
  }

  const whatsappNumber = data.whatsappNumber || data.whatsapp;
  if (typeof whatsappNumber !== 'string' || whatsappNumber.trim().length < 8) {
    errors.whatsappNumber = 'Nomor WhatsApp minimal 8 digit.';
  } else if (whatsappNumber.trim().length > 30) {
    errors.whatsappNumber = 'Nomor WhatsApp maksimal 30 karakter.';
  }

  let email: string | null = null;
  if (
    data.email !== undefined &&
    data.email !== null &&
    String(data.email).trim().length > 0
  ) {
    const rawEmail = String(data.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      errors.email = 'Format email tidak valid.';
    } else {
      email = rawEmail;
    }
  }

  let preferredDate = '';
  if (!data.preferredDate) {
    errors.preferredDate = 'Tanggal rencana keberangkatan wajib diisi.';
  } else {
    const d = new Date(String(data.preferredDate));
    if (isNaN(d.getTime())) {
      errors.preferredDate = 'Format tanggal rencana tidak valid.';
    } else {
      preferredDate = d.toISOString();
    }
  }

  let alternativeDate: string | null = null;
  if (
    data.alternativeDate !== undefined &&
    data.alternativeDate !== null &&
    String(data.alternativeDate).trim().length > 0
  ) {
    const d = new Date(String(data.alternativeDate));
    if (isNaN(d.getTime())) {
      errors.alternativeDate = 'Format tanggal alternatif tidak valid.';
    } else {
      alternativeDate = d.toISOString();
    }
  }

  let participantCount = 0;
  if (data.participantCount === undefined || data.participantCount === null) {
    errors.participantCount = 'Jumlah peserta wajib diisi.';
  } else {
    participantCount = Number(data.participantCount);
    if (!Number.isInteger(participantCount) || participantCount < 1) {
      errors.participantCount = 'Jumlah peserta minimal 1 orang.';
    } else if (participantCount > 1000) {
      errors.participantCount = 'Jumlah peserta maksimal 1000 orang.';
    }
  }

  const meetingPointRequest = data.meetingPointRequest || data.meetingPoint;
  if (
    typeof meetingPointRequest !== 'string' ||
    meetingPointRequest.trim().length < 2
  ) {
    errors.meetingPointRequest =
      'Lokasi meeting point / penjemputan minimal 2 karakter.';
  }

  let mountainId: string | null = null;
  let destinationOther: string | null = null;
  const destination =
    typeof data.destination === 'string' ? data.destination.trim() : '';

  if (
    typeof data.mountainId === 'string' &&
    data.mountainId.trim().length > 0
  ) {
    mountainId = data.mountainId.trim();
  }
  if (
    typeof data.destinationOther === 'string' &&
    data.destinationOther.trim().length > 0
  ) {
    destinationOther = data.destinationOther.trim();
  }

  if (!mountainId && !destinationOther) {
    if (destination.length > 0) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          destination,
        );
      if (isUuid) {
        mountainId = destination;
      } else {
        destinationOther = destination;
      }
    } else {
      errors.destination = 'Destinasi atau gunung tujuan wajib dipilih/diisi.';
    }
  }

  let budget: number | null = null;
  if (
    data.budget !== undefined &&
    data.budget !== null &&
    String(data.budget).trim() !== ''
  ) {
    const b = Number(data.budget);
    if (isNaN(b) || b < 0) {
      errors.budget = 'Budget harus berupa angka positif.';
    } else {
      budget = b;
    }
  }

  const requirements =
    data.requirements !== undefined &&
    data.requirements !== null &&
    String(data.requirements).trim().length > 0
      ? String(data.requirements).trim()
      : null;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      destination: destination || (destinationOther ?? ''),
      mountainId,
      destinationOther,
      customerName: String(customerName).trim(),
      whatsappNumber: String(whatsappNumber).trim(),
      email,
      preferredDate,
      alternativeDate,
      participantCount,
      meetingPointRequest: String(meetingPointRequest).trim(),
      budget,
      requirements,
    },
  };
}

export function validateUpdatePrivateTripInquiry(
  body: unknown,
): ValidationResult<UpdatePrivateTripInquiryPayload> {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: {
        body: 'Payload update private trip inquiry harus berupa object.',
      },
    };
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const result: UpdatePrivateTripInquiryPayload = {};

  if (data.status !== undefined) {
    if (
      typeof data.status !== 'string' ||
      !PRIVATE_TRIP_STATUSES.has(data.status as PrivateTripStatus)
    ) {
      errors.status = `Status tidak valid. Harus salah satu dari: ${Array.from(PRIVATE_TRIP_STATUSES).join(', ')}`;
    } else {
      result.status = data.status as PrivateTripStatus;
    }
  }

  if (data.assignedAdminId !== undefined) {
    if (data.assignedAdminId === null || data.assignedAdminId === '') {
      result.assignedAdminId = null;
    } else if (typeof data.assignedAdminId !== 'string') {
      errors.assignedAdminId = 'assignedAdminId harus berupa string UUID.';
    } else {
      result.assignedAdminId = data.assignedAdminId.trim();
    }
  }

  if (data.adminNotes !== undefined) {
    result.adminNotes =
      data.adminNotes === null || data.adminNotes === ''
        ? null
        : String(data.adminNotes).trim();
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validatePrivateTripInquiryQuery(
  query: Record<string, unknown>,
): ValidationResult<PrivateTripInquiryQueryPayload> {
  const result: PrivateTripInquiryQueryPayload = {};
  const errors: Record<string, string> = {};

  if (query.status !== undefined && query.status !== '') {
    if (
      typeof query.status !== 'string' ||
      !PRIVATE_TRIP_STATUSES.has(query.status as PrivateTripStatus)
    ) {
      errors.status = `Filter status tidak valid: ${query.status}`;
    } else {
      result.status = query.status as PrivateTripStatus;
    }
  }

  if (query.search !== undefined && typeof query.search === 'string') {
    result.search = query.search.trim();
  }

  if (query.page !== undefined) {
    const p = Number(query.page);
    if (!Number.isInteger(p) || p < 1) {
      errors.page = 'Page harus berupa bilangan bulat >= 1.';
    } else {
      result.page = p;
    }
  }

  if (query.pageSize !== undefined) {
    const ps = Number(query.pageSize);
    if (!Number.isInteger(ps) || ps < 1 || ps > 100) {
      errors.pageSize = 'PageSize harus antara 1 dan 100.';
    } else {
      result.pageSize = ps;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

const VALID_CONTENT_STATUSES = new Set<ContentStatus>([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);

export function validateCreateFaq(
  input: unknown,
): ValidationResult<CreateFaqPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const errors: Record<string, string> = {};

  const question =
    typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    errors.question = 'Pertanyaan FAQ wajib diisi.';
  } else if (question.length > 500) {
    errors.question = 'Pertanyaan FAQ maksimal 500 karakter.';
  }

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!answer) {
    errors.answer = 'Jawaban FAQ wajib diisi.';
  }

  const category =
    typeof body.category === 'string' && body.category.trim().length > 0
      ? body.category.trim()
      : null;

  let sortOrder = 0;
  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const parsed = Number(body.sortOrder);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.sortOrder = 'Urutan sortOrder harus berupa integer non-negatif.';
    } else {
      sortOrder = parsed;
    }
  }

  let status: ContentStatus = 'DRAFT';
  if (body.status !== undefined && body.status !== null) {
    if (
      typeof body.status !== 'string' ||
      !VALID_CONTENT_STATUSES.has(body.status as ContentStatus)
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      status = body.status as ContentStatus;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      question,
      answer,
      category,
      sortOrder,
      status,
    },
  };
}

export function validateUpdateFaq(
  input: unknown,
): ValidationResult<UpdateFaqPayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const errors: Record<string, string> = {};
  const result: UpdateFaqPayload = {};

  if (body.question !== undefined) {
    if (typeof body.question !== 'string' || !body.question.trim()) {
      errors.question = 'Pertanyaan FAQ tidak boleh kosong.';
    } else if (body.question.trim().length > 500) {
      errors.question = 'Pertanyaan FAQ maksimal 500 karakter.';
    } else {
      result.question = body.question.trim();
    }
  }

  if (body.answer !== undefined) {
    if (typeof body.answer !== 'string' || !body.answer.trim()) {
      errors.answer = 'Jawaban FAQ tidak boleh kosong.';
    } else {
      result.answer = body.answer.trim();
    }
  }

  if (body.category !== undefined) {
    result.category =
      typeof body.category === 'string' && body.category.trim().length > 0
        ? body.category.trim()
        : null;
  }

  if (body.sortOrder !== undefined) {
    const parsed = Number(body.sortOrder);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.sortOrder = 'Urutan sortOrder harus berupa integer non-negatif.';
    } else {
      result.sortOrder = parsed;
    }
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== 'string' ||
      !VALID_CONTENT_STATUSES.has(body.status as ContentStatus)
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      result.status = body.status as ContentStatus;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateFaqQuery(
  query: Record<string, unknown>,
): ValidationResult<FaqQueryPayload> {
  const result: FaqQueryPayload = {};
  const errors: Record<string, string> = {};

  if (query.category !== undefined && typeof query.category === 'string') {
    result.category = query.category.trim();
  }

  if (query.search !== undefined && typeof query.search === 'string') {
    result.search = query.search.trim();
  }

  if (query.status !== undefined && query.status !== '') {
    if (
      query.status !== 'ALL' &&
      !VALID_CONTENT_STATUSES.has(query.status as ContentStatus)
    ) {
      errors.status = `Filter status FAQ tidak valid: ${query.status}`;
    } else {
      result.status = query.status as ContentStatus | 'ALL';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateCreateContentPage(
  input: unknown,
): ValidationResult<CreateContentPagePayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const errors: Record<string, string> = {};

  const pageKey =
    typeof body.pageKey === 'string' ? body.pageKey.trim().toLowerCase() : '';
  if (!pageKey) {
    errors.pageKey = 'Page key wajib diisi.';
  } else if (pageKey.length > 100) {
    errors.pageKey = 'Page key maksimal 100 karakter.';
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    errors.title = 'Judul halaman wajib diisi.';
  } else if (title.length > 200) {
    errors.title = 'Judul halaman maksimal 200 karakter.';
  }

  let slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug && title) {
    slug = slugify(title);
  }
  if (!slug) {
    errors.slug = 'Slug halaman wajib diisi.';
  } else if (slug.length > 200) {
    errors.slug = 'Slug halaman maksimal 200 karakter.';
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    errors.content = 'Konten halaman wajib diisi.';
  }

  let status: ContentStatus = 'DRAFT';
  if (body.status !== undefined && body.status !== null) {
    if (
      typeof body.status !== 'string' ||
      !VALID_CONTENT_STATUSES.has(body.status as ContentStatus)
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      status = body.status as ContentStatus;
    }
  }

  const seoTitle =
    typeof body.seoTitle === 'string' && body.seoTitle.trim().length > 0
      ? body.seoTitle.trim()
      : null;
  const seoDescription =
    typeof body.seoDescription === 'string' &&
    body.seoDescription.trim().length > 0
      ? body.seoDescription.trim()
      : null;

  let publishedAt: Date | string | null = null;
  if (status === 'PUBLISHED') {
    publishedAt = new Date();
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      pageKey,
      title,
      slug,
      content,
      status,
      seoTitle,
      seoDescription,
      publishedAt,
    },
  };
}

export function validateUpdateContentPage(
  input: unknown,
): ValidationResult<UpdateContentPagePayload> {
  const body =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const errors: Record<string, string> = {};
  const result: UpdateContentPagePayload = {};

  if (body.pageKey !== undefined) {
    if (typeof body.pageKey !== 'string' || !body.pageKey.trim()) {
      errors.pageKey = 'Page key tidak boleh kosong.';
    } else {
      result.pageKey = body.pageKey.trim().toLowerCase();
    }
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.title = 'Judul halaman tidak boleh kosong.';
    } else if (body.title.trim().length > 200) {
      errors.title = 'Judul halaman maksimal 200 karakter.';
    } else {
      result.title = body.title.trim();
    }
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      errors.slug = 'Slug halaman tidak boleh kosong.';
    } else if (body.slug.trim().length > 200) {
      errors.slug = 'Slug halaman maksimal 200 karakter.';
    } else {
      result.slug = body.slug.trim();
    }
  }

  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || !body.content.trim()) {
      errors.content = 'Konten halaman tidak boleh kosong.';
    } else {
      result.content = body.content.trim();
    }
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== 'string' ||
      !VALID_CONTENT_STATUSES.has(body.status as ContentStatus)
    ) {
      errors.status = 'Status konten tidak valid.';
    } else {
      result.status = body.status as ContentStatus;
      if (result.status === 'PUBLISHED') {
        result.publishedAt = new Date();
      }
    }
  }

  if (body.seoTitle !== undefined) {
    result.seoTitle =
      typeof body.seoTitle === 'string' && body.seoTitle.trim().length > 0
        ? body.seoTitle.trim()
        : null;
  }

  if (body.seoDescription !== undefined) {
    result.seoDescription =
      typeof body.seoDescription === 'string' &&
      body.seoDescription.trim().length > 0
        ? body.seoDescription.trim()
        : null;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export function validateContentPageQuery(
  query: Record<string, unknown>,
): ValidationResult<ContentPageQueryPayload> {
  const result: ContentPageQueryPayload = {};
  const errors: Record<string, string> = {};

  if (query.search !== undefined && typeof query.search === 'string') {
    result.search = query.search.trim();
  }

  if (query.status !== undefined && query.status !== '') {
    if (
      query.status !== 'ALL' &&
      !VALID_CONTENT_STATUSES.has(query.status as ContentStatus)
    ) {
      errors.status = `Filter status content page tidak valid: ${query.status}`;
    } else {
      result.status = query.status as ContentStatus | 'ALL';
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: result };
}

export const SUPPORTED_SETTING_KEYS = [
  'business_whatsapp',
  'instagram_url',
  'contact_email',
  'almost_full_percentage',
] as const;

export type SupportedSettingKey = (typeof SUPPORTED_SETTING_KEYS)[number];

export function validateUpdateSetting(
  key: string,
  payload: unknown,
): ValidationResult<{ key: SupportedSettingKey; value: unknown }> {
  if (!SUPPORTED_SETTING_KEYS.includes(key as SupportedSettingKey)) {
    return {
      valid: false,
      errors: {
        key: `Kunci pengaturan '${key}' tidak didukung atau dilarang.`,
      },
    };
  }

  if (typeof payload !== 'object' || payload === null) {
    return {
      valid: false,
      errors: { body: 'Payload harus berupa object dengan field value.' },
    };
  }

  const body = payload as { value?: unknown };
  if (body.value === undefined || body.value === null) {
    return {
      valid: false,
      errors: { value: 'Nilai pengaturan (value) wajib diisi.' },
    };
  }

  const errors: Record<string, string> = {};
  let normalizedValue: unknown = body.value;

  switch (key) {
    case 'business_whatsapp': {
      if (typeof body.value !== 'string') {
        errors.value = 'Nomor WhatsApp bisnis harus berupa teks string.';
      } else {
        const cleaned = normalizePhoneNumber(body.value);
        if (cleaned.length < 9 || cleaned.length > 16) {
          errors.value =
            'Nomor WhatsApp bisnis tidak valid (panjang 9-16 digit angka).';
        } else {
          normalizedValue = cleaned;
        }
      }
      break;
    }
    case 'instagram_url': {
      if (typeof body.value !== 'string') {
        errors.value = 'URL Instagram harus berupa teks string.';
      } else {
        const trimmed = body.value.trim();
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          errors.value =
            'URL Instagram harus dimulai dengan http:// atau https://.';
        } else if (trimmed.length > 255) {
          errors.value =
            'URL Instagram terlalu panjang (maksimum 255 karakter).';
        } else {
          normalizedValue = trimmed;
        }
      }
      break;
    }
    case 'contact_email': {
      if (typeof body.value !== 'string') {
        errors.value = 'Email kontak harus berupa teks string.';
      } else {
        const trimmed = body.value.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          errors.value = 'Format email kontak tidak valid.';
        } else if (trimmed.length > 254) {
          errors.value =
            'Email kontak terlalu panjang (maksimum 254 karakter).';
        } else {
          normalizedValue = trimmed;
        }
      }
      break;
    }
    case 'almost_full_percentage': {
      const num = Number(body.value);
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        errors.value =
          'Persentase hampir penuh harus berupa bilangan bulat antara 1 dan 100.';
      } else {
        normalizedValue = num;
      }
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      key: key as SupportedSettingKey,
      value: normalizedValue,
    },
  };
}

export function validateAuditLogQuery(query: Record<string, unknown>): {
  page: number;
  limit: number;
  adminUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
} {
  let page = 1;
  let limit = 20;

  if (query.page) {
    const p = parseInt(String(query.page), 10);
    if (!isNaN(p) && p > 0) page = p;
  }

  const limitParam = query.limit || query.pageSize;
  if (limitParam) {
    const l = parseInt(String(limitParam), 10);
    if (!isNaN(l) && l > 0) {
      limit = Math.min(l, 100);
    }
  }

  const result: {
    page: number;
    limit: number;
    adminUserId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
  } = { page, limit };

  if (typeof query.adminUserId === 'string' && query.adminUserId.trim()) {
    result.adminUserId = query.adminUserId.trim();
  }

  if (typeof query.entityType === 'string' && query.entityType.trim()) {
    result.entityType = query.entityType.trim().toUpperCase();
  }

  if (typeof query.entityId === 'string' && query.entityId.trim()) {
    result.entityId = query.entityId.trim();
  }

  if (typeof query.action === 'string' && query.action.trim()) {
    result.action = query.action.trim().toUpperCase();
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    result.search = query.search.trim();
  }

  if (typeof query.fromDate === 'string' && query.fromDate.trim()) {
    const d = new Date(query.fromDate.trim());
    if (!isNaN(d.getTime())) result.fromDate = d;
  }

  if (typeof query.toDate === 'string' && query.toDate.trim()) {
    const d = new Date(query.toDate.trim());
    if (!isNaN(d.getTime())) result.toDate = d;
  }

  return result;
}

export const VALID_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'OPERATIONS',
  'CONTENT',
] as const;
export type ValidAdminRole = (typeof VALID_ADMIN_ROLES)[number];

export function validateCreateAdminUser(body: unknown): {
  valid: boolean;
  data?: {
    name: string;
    email: string;
    password: string;
    roles: string[];
  };
  errors?: Record<string, string>;
} {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Request body harus berupa JSON objek.' },
    };
  }

  const obj = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name || name.length < 2) {
    errors.name = 'Nama admin minimal 2 karakter.';
  }

  const email =
    typeof obj.email === 'string' ? obj.email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Format email tidak valid.';
  }

  const password = typeof obj.password === 'string' ? obj.password : '';
  if (!password || password.length < 8) {
    errors.password = 'Kata sandi minimal 8 karakter.';
  }

  const roles = Array.isArray(obj.roles) ? obj.roles : [];
  if (roles.length === 0) {
    errors.roles = 'Admin minimal harus memiliki satu role.';
  } else {
    for (const r of roles) {
      if (!VALID_ADMIN_ROLES.includes(r as ValidAdminRole)) {
        errors.roles = `Role ${r} tidak valid. Pilihan: ${VALID_ADMIN_ROLES.join(', ')}`;
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { name, email, password, roles: roles as string[] },
  };
}

export function validateUpdateAdminUser(body: unknown): {
  valid: boolean;
  data?: {
    name?: string;
    roles?: string[];
    status?: 'ACTIVE' | 'DISABLED';
  };
  errors?: Record<string, string>;
} {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      errors: { body: 'Request body harus berupa JSON objek.' },
    };
  }

  const obj = body as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const data: {
    name?: string;
    roles?: string[];
    status?: 'ACTIVE' | 'DISABLED';
  } = {};

  if (obj.name !== undefined) {
    if (typeof obj.name !== 'string' || obj.name.trim().length < 2) {
      errors.name = 'Nama admin minimal 2 karakter.';
    } else {
      data.name = obj.name.trim();
    }
  }

  if (obj.roles !== undefined) {
    if (!Array.isArray(obj.roles) || obj.roles.length === 0) {
      errors.roles = 'Admin minimal harus memiliki satu role.';
    } else {
      for (const r of obj.roles) {
        if (!VALID_ADMIN_ROLES.includes(r as ValidAdminRole)) {
          errors.roles = `Role ${r} tidak valid. Pilihan: ${VALID_ADMIN_ROLES.join(', ')}`;
          break;
        }
      }
      if (!errors.roles) {
        data.roles = obj.roles as string[];
      }
    }
  }

  if (obj.status !== undefined) {
    if (obj.status !== 'ACTIVE' && obj.status !== 'DISABLED') {
      errors.status = 'Status harus ACTIVE atau DISABLED.';
    } else {
      data.status = obj.status;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}

// --------------------------------------------------------------------------
// STEP 35 — Analytics Validation & PII Sanitizer
// --------------------------------------------------------------------------

export const VALID_ANALYTICS_EVENTS: AnalyticsEventName[] = [
  'view_home',
  'view_trip_list',
  'view_trip',
  'select_schedule',
  'select_package',
  'click_book_whatsapp',
  'click_health_whatsapp',
  'private_trip_inquiry',
];

export const BLOCKED_PII_KEYS = new Set([
  'phone',
  'phonenumber',
  'contactphone',
  'whatsapp',
  'whatsappnumber',
  'businesswhatsapp',
  'email',
  'contactemail',
  'name',
  'fullname',
  'customername',
  'identity',
  'identitynumber',
  'nik',
  'passport',
  'medical',
  'medicaldata',
  'medicalhistory',
  'healthnote',
  'allergies',
  'emergencycontact',
  'emergencyphone',
]);

export function sanitizeAnalyticsProperties(
  properties?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') {
    return {};
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) continue;

    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    if (BLOCKED_PII_KEYS.has(normalizedKey)) {
      continue;
    }

    // String pattern PII checks
    if (typeof value === 'string') {
      // Email format
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        continue;
      }
      // Phone format (>= 9 digits with optional leading +)
      const digitsOnly = value.replace(/[\s+-]/g, '');
      if (/^[0-9]{9,15}$/.test(digitsOnly)) {
        continue;
      }
    }

    clean[key] = value;
  }

  return clean;
}

export function validateAnalyticsEvent(payload: unknown): {
  valid: boolean;
  errors?: Record<string, string>;
  data?: {
    event: AnalyticsEventName;
    timestamp: string;
    properties: Record<string, unknown>;
  };
} {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: { payload: 'Event payload must be an object' },
    };
  }

  const obj = payload as Record<string, unknown>;
  const errors: Record<string, string> = {};

  if (!obj.event || typeof obj.event !== 'string') {
    errors.event = 'Event name is required';
  } else if (
    !VALID_ANALYTICS_EVENTS.includes(obj.event as AnalyticsEventName)
  ) {
    errors.event = `Invalid event name: ${obj.event}`;
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  const rawProps = (
    obj.properties && typeof obj.properties === 'object'
      ? (obj.properties as Record<string, unknown>)
      : {}
  ) as Record<string, unknown>;

  const sanitizedProps = sanitizeAnalyticsProperties(rawProps);

  return {
    valid: true,
    data: {
      event: obj.event as AnalyticsEventName,
      timestamp:
        typeof obj.timestamp === 'string' && obj.timestamp.length > 0
          ? obj.timestamp
          : new Date().toISOString(),
      properties: sanitizedProps,
    },
  };
}
