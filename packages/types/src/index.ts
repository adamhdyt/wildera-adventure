export type DestinationStatus = 'ACTIVE' | 'INACTIVE';

export interface Destination {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  region: string | null;
  description: string | null;
  status: DestinationStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  _count?: {
    mountains: number;
  };
}

export interface CreateDestinationPayload {
  name: string;
  slug?: string;
  province?: string | null;
  region?: string | null;
  description?: string | null;
  status?: DestinationStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateDestinationPayload {
  name?: string;
  slug?: string;
  province?: string | null;
  region?: string | null;
  description?: string | null;
  status?: DestinationStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface DestinationQueryPayload {
  search?: string;
  status?: DestinationStatus | 'ALL';
  limit?: number;
  offset?: number;
}

export interface DestinationListResponse {
  items: Destination[];
  total: number;
  limit: number;
  offset: number;
}

export type DifficultyLevel = 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Mountain {
  id: string;
  destinationId: string;
  name: string;
  slug: string;
  altitudeM: number | null;
  shortDescription: string | null;
  description: string | null;
  defaultDifficulty: DifficultyLevel | null;
  bestSeason: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  status: ContentStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  destination?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    routes: number;
    trips?: number;
  };
}

export interface CreateMountainPayload {
  destinationId: string;
  name: string;
  slug?: string;
  altitudeM?: number | null;
  shortDescription?: string | null;
  description?: string | null;
  defaultDifficulty?: DifficultyLevel | null;
  bestSeason?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateMountainPayload {
  destinationId?: string;
  name?: string;
  slug?: string;
  altitudeM?: number | null;
  shortDescription?: string | null;
  description?: string | null;
  defaultDifficulty?: DifficultyLevel | null;
  bestSeason?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface MountainQueryPayload {
  search?: string;
  destinationId?: string;
  status?: ContentStatus | 'ALL';
  difficulty?: DifficultyLevel | 'ALL';
  limit?: number;
  offset?: number;
}

export interface MountainListResponse {
  items: Mountain[];
  total: number;
  limit: number;
  offset: number;
}

export interface Route {
  id: string;
  mountainId: string;
  name: string;
  slug: string;
  description: string | null;
  distanceKm: number | string | null;
  elevationGainM: number | null;
  estimatedDurationHours: number | string | null;
  difficulty: DifficultyLevel | null;
  startingPoint: string | null;
  status: ContentStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  mountain?: {
    id: string;
    name: string;
    slug: string;
    destinationId: string;
    destination?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    trips: number;
  };
}

export interface CreateRoutePayload {
  mountainId: string;
  name: string;
  slug?: string;
  description?: string | null;
  distanceKm?: number | string | null;
  elevationGainM?: number | null;
  estimatedDurationHours?: number | string | null;
  difficulty?: DifficultyLevel | null;
  startingPoint?: string | null;
  status?: ContentStatus;
}

export interface UpdateRoutePayload {
  mountainId?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  distanceKm?: number | string | null;
  elevationGainM?: number | null;
  estimatedDurationHours?: number | string | null;
  difficulty?: DifficultyLevel | null;
  startingPoint?: string | null;
  status?: ContentStatus;
}

export interface RouteQueryPayload {
  search?: string;
  mountainId?: string;
  status?: ContentStatus | 'ALL';
  difficulty?: DifficultyLevel | 'ALL';
  limit?: number;
  offset?: number;
}

export interface RouteListResponse {
  items: Route[];
  total: number;
  limit: number;
  offset: number;
}

export type TripType = 'OPEN_TRIP' | 'PRIVATE_TRIP' | 'TEKTOK' | 'MULTI_DAY';

export interface Trip {
  id: string;
  mountainId: string;
  routeId: string | null;
  name: string;
  slug: string;
  tripType: TripType;
  shortDescription: string | null;
  description: string | null;
  durationDays: number;
  durationNights: number;
  difficulty: DifficultyLevel;
  beginnerFriendly: boolean;
  healthCertificateRequired: boolean;
  minimumAge: number | null;
  maximumAge: number | null;
  status: ContentStatus;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | Date | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  mountain?: Mountain;
  route?: Route | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    schedules: number;
    itineraries?: number;
    facilities?: number;
    gears?: number;
    faqs?: number;
  };
}

export interface CreateTripPayload {
  mountainId: string;
  routeId?: string | null;
  name: string;
  slug?: string;
  tripType: TripType;
  shortDescription?: string | null;
  description?: string | null;
  durationDays: number;
  durationNights?: number;
  difficulty: DifficultyLevel;
  beginnerFriendly?: boolean;
  healthCertificateRequired?: boolean;
  minimumAge?: number | null;
  maximumAge?: number | null;
  status?: ContentStatus;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateTripPayload {
  mountainId?: string;
  routeId?: string | null;
  name?: string;
  slug?: string;
  tripType?: TripType;
  shortDescription?: string | null;
  description?: string | null;
  durationDays?: number;
  durationNights?: number;
  difficulty?: DifficultyLevel;
  beginnerFriendly?: boolean;
  healthCertificateRequired?: boolean;
  minimumAge?: number | null;
  maximumAge?: number | null;
  status?: ContentStatus;
  featured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface TripQueryPayload {
  search?: string;
  mountainId?: string;
  routeId?: string;
  tripType?: TripType | 'ALL';
  difficulty?: DifficultyLevel | 'ALL';
  status?: ContentStatus | 'ALL';
  featured?: boolean | string;
  limit?: number;
  offset?: number;
}

export interface TripListResponse {
  items: Trip[];
  total: number;
  limit: number;
  offset: number;
}

export type FacilityType = 'INCLUDE' | 'EXCLUDE';
export type GearType = 'MANDATORY' | 'RECOMMENDED';

export interface TripItinerary {
  id: string;
  tripId: string;
  dayNumber: number;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TripFacility {
  id: string;
  tripId: string;
  facilityType: FacilityType;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TripGear {
  id: string;
  tripId: string;
  gearType: GearType;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TripFaq {
  id: string;
  tripId: string;
  question: string;
  answer: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TripContent {
  tripId: string;
  itineraries: TripItinerary[];
  facilities: TripFacility[];
  gears: TripGear[];
  faqs: TripFaq[];
}

export interface UpdateTripContentPayload {
  itineraries?: Array<{
    dayNumber: number;
    title: string;
    description?: string | null;
    sortOrder?: number;
  }>;
  facilities?: Array<{
    facilityType: FacilityType;
    name: string;
    description?: string | null;
    sortOrder?: number;
  }>;
  gears?: Array<{
    gearType: GearType;
    name: string;
    description?: string | null;
    sortOrder?: number;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
    sortOrder?: number;
    status?: ContentStatus;
  }>;
}

export type MediaRole = 'COVER' | 'GALLERY';

export interface MediaAsset {
  id: string;
  objectKey: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number | string;
  widthPx?: number | null;
  heightPx?: number | null;
  altText?: string | null;
  createdBy: string;
  createdAt: string | Date;
}

export interface TripMedia {
  id: string;
  tripId: string;
  mediaId: string;
  mediaRole: MediaRole;
  sortOrder: number;
  createdAt: string | Date;
  media?: MediaAsset;
}

export interface MountainMedia {
  id: string;
  mountainId: string;
  mediaId: string;
  mediaRole: MediaRole;
  sortOrder: number;
  createdAt: string | Date;
  media?: MediaAsset;
}

export interface TripMediaResponse {
  cover: TripMedia | null;
  gallery: TripMedia[];
}

export interface UpdateTripMediaPayload {
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
}

export interface MountainMediaResponse {
  cover: MountainMedia | null;
  gallery: MountainMedia[];
}

export interface UpdateMountainMediaPayload {
  coverMediaId?: string | null;
  galleryMediaIds?: string[];
}

export interface TripPublishValidationResult {
  ready: boolean;
  errors: Record<string, string>;
}

export type ScheduleStatus =
  'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';

export type AvailabilityStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'SOLD_OUT';

export interface TripSchedule {
  id: string;
  tripId: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  capacity: number;
  minimumParticipants: number | null;
  status: ScheduleStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  trip?: {
    id: string;
    name: string;
    slug: string;
    tripType?: string;
  };
  confirmedSeats?: number;
  availableSeats?: number;
  availabilityStatus?: AvailabilityStatus;
  packages?: SchedulePackage[];
}

export interface CreateSchedulePayload {
  tripId: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  capacity: number;
  minimumParticipants?: number | null;
  notes?: string | null;
}

export interface UpdateSchedulePayload {
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string | null;
  capacity?: number;
  minimumParticipants?: number | null;
  status?: ScheduleStatus;
  notes?: string | null;
}

export interface ScheduleQueryPayload {
  tripId?: string;
  status?: ScheduleStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ScheduleListResponse {
  data: TripSchedule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScheduleManifestParticipant {
  id: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  fullName: string;
  dateOfBirth?: string | null;
  gender?: GenderType | null;
  phone?: string | null;
  identityType?: IdentityType | null;
  identityNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  packageName?: string | null;
}

export interface ScheduleManifestBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: BookingStatus;
  packageName: string;
  participantCount: number; // expected
  completedCount: number; // actual filled
  participants: BookingParticipantItem[];
}

export interface ScheduleManifestSummary {
  trip: {
    id: string;
    name: string;
    slug: string;
    tripType: string;
  };
  schedule: {
    id: string;
    startDate: string;
    endDate: string;
    status: ScheduleStatus;
    capacity: number;
    confirmedSeats: number;
    availableSeats: number;
  };
  confirmedBookingsCount: number;
  expectedParticipants: number;
  completedParticipantsCount: number;
  bookings: ScheduleManifestBooking[];
  participantList: ScheduleManifestParticipant[];
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface MeetingPoint {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingPointPayload {
  name: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status?: EntityStatus;
}

export interface UpdateMeetingPointPayload {
  name?: string;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status?: EntityStatus;
}

export interface SchedulePackage {
  id: string;
  scheduleId: string;
  meetingPointId?: string | null;
  name: string;
  description?: string | null;
  price: number;
  meetingDatetime?: string | null;
  status: EntityStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  meetingPoint?: MeetingPoint | null;
}

export interface CreatePackagePayload {
  name: string;
  description?: string | null;
  price: number;
  meetingPointId?: string | null;
  meetingDatetime?: string | null;
  status?: EntityStatus;
  sortOrder?: number;
}

export interface UpdatePackagePayload {
  name?: string;
  description?: string | null;
  price?: number;
  meetingPointId?: string | null;
  meetingDatetime?: string | null;
  status?: EntityStatus;
  sortOrder?: number;
}

// ==========================================
// PUBLIC API TYPES (STEP 17)
// ==========================================

export interface PublicTripNextSchedule {
  id: string;
  startDate: string;
  endDate: string;
  capacity: number;
  confirmedSeats: number;
  availableSeats: number;
  availabilityStatus: AvailabilityStatus;
  startingPrice: number;
}

export interface PublicTripSummary {
  id: string;
  name: string;
  slug: string;
  tripType: TripType;
  difficulty: DifficultyLevel;
  beginnerFriendly: boolean;
  duration: {
    days: number;
    nights: number;
  };
  mountain: {
    name: string;
    slug: string;
    altitudeM: number;
  };
  coverImage: {
    url: string;
    alt: string;
  };
  nextSchedule?: PublicTripNextSchedule | null;
}

export interface PublicSchedulePackage {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  meetingPoint?: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
  } | null;
  meetingDatetime?: string | null;
}

export interface PublicTripSchedule {
  id: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  lifecycleStatus: ScheduleStatus;
  capacity: number;
  confirmedSeats: number;
  availableSeats: number;
  availabilityStatus: AvailabilityStatus;
  bookable: boolean;
  packages: PublicSchedulePackage[];
}

export interface PublicTripDetail {
  id: string;
  name: string;
  slug: string;
  tripType: TripType;
  shortDescription?: string | null;
  description?: string | null;
  highlights: string[];
  difficulty: DifficultyLevel;
  beginnerFriendly: boolean;
  healthCertificateRequired: boolean;
  minimumAge?: number | null;
  maximumAge?: number | null;
  duration: {
    days: number;
    nights: number;
  };
  mountain: {
    id: string;
    name: string;
    slug: string;
    altitudeM: number;
    destination: {
      name: string;
    };
  };
  route?: {
    id: string;
    name: string;
  } | null;
  media: {
    cover: { url: string; alt: string };
    gallery: Array<{ url: string; alt: string }>;
  };
  schedules: PublicTripSchedule[];
  itinerary: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string;
  }>;
  includes: Array<{
    id: string;
    item: string;
    description?: string | null;
  }>;
  excludes: Array<{
    id: string;
    item: string;
    description?: string | null;
  }>;
  mandatoryGear: Array<{
    id: string;
    gearName: string;
    specification?: string | null;
  }>;
  recommendedGear: Array<{
    id: string;
    gearName: string;
    specification?: string | null;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  seo: {
    title: string;
    description: string;
  };
}

export interface PublicMountainSummary {
  id: string;
  name: string;
  slug: string;
  altitudeM: number;
  defaultDifficulty: DifficultyLevel;
  destination: {
    name: string;
  };
  coverImage: {
    url: string;
    alt: string;
  };
}

export interface PublicMountainDetail {
  id: string;
  name: string;
  slug: string;
  altitudeM: number;
  description?: string | null;
  bestSeason?: string | null;
  defaultDifficulty: DifficultyLevel;
  destination: {
    id: string;
    name: string;
    slug: string;
  };
  routes: Array<{
    id: string;
    name: string;
    slug: string;
    distanceKm?: number | null;
    elevationGainM?: number | null;
    estimatedHours?: number | null;
  }>;
  media: {
    cover: { url: string; alt: string };
    gallery: Array<{ url: string; alt: string }>;
  };
  upcomingTrips: PublicTripSummary[];
  seo: {
    title: string;
    description: string;
  };
}

export interface PublicDestination {
  id: string;
  name: string;
  slug: string;
  province: string;
}

export interface PublicFaq {
  id: string;
  category?: string | null;
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface PublicContentPage {
  title: string;
  slug: string;
  pageKey?: string;
  content: string;
  publishedAt?: string | null;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
  };
}

export type SiteSettingKey =
  | 'business_whatsapp'
  | 'instagram_url'
  | 'contact_email'
  | 'almost_full_percentage';

export interface SiteSettingItem {
  id: string;
  settingKey: string;
  settingValue: unknown;
  isPublic: boolean;
  updatedBy?: string | null;
  updatedAt: string | Date;
}

export interface UpdateSiteSettingPayload {
  value: unknown;
}

export interface PublicSiteSettings {
  business_whatsapp?: string;
  instagram_url?: string;
  contact_email?: string;
  almost_full_percentage?: number;
  [key: string]: unknown;
}

export interface PublicTripQuery {
  search?: string;
  month?: string;
  type?: TripType;
  difficulty?: DifficultyLevel;
  availability?: AvailabilityStatus;
  mountain?: string;
  destination?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PublicMountainQuery {
  search?: string;
  destination?: string;
  difficulty?: DifficultyLevel;
  page?: number;
  pageSize?: number;
}

export type BookingStatus =
  | 'INQUIRY'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type BookingSource =
  'WEBSITE_WHATSAPP' | 'WHATSAPP' | 'INSTAGRAM' | 'ADMIN' | 'OTHER';

export type GenderType = 'MALE' | 'FEMALE';

export type IdentityType = 'KTP' | 'PASSPORT' | 'OTHER';

export interface CustomerSummary {
  id: string;
  fullName: string;
  whatsappNumber: string;
  email?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BookingParticipantItem {
  id: string;
  bookingId: string;
  fullName: string;
  dateOfBirth?: string | Date | null;
  gender?: GenderType | null;
  phone?: string | null;
  identityType?: IdentityType | null;
  identityNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateParticipantPayload {
  fullName: string;
  dateOfBirth?: string | Date | null;
  gender?: GenderType | null;
  phone?: string | null;
  identityType?: IdentityType | null;
  identityNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
}

export type UpdateParticipantPayload = Partial<CreateParticipantPayload>;

export interface AdminBookingItem {
  id: string;
  bookingNumber: string;
  customerId?: string | null;
  scheduleId: string;
  packageId: string;
  status: BookingStatus;
  source: BookingSource;
  participantCount: number;
  totalAmount?: number | string | null;
  contactName: string;
  contactWhatsapp: string;
  contactEmail?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  confirmedAt?: string | Date | null;
  cancelledAt?: string | Date | null;
  completedAt?: string | Date | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: CustomerSummary | null;
  schedule?: {
    id: string;
    startDate: string | Date;
    endDate: string | Date;
    capacity: number;
    status: string;
    trip: {
      id: string;
      name: string;
      slug: string;
      mountain?: {
        name: string;
      };
    };
  };
  package?: {
    id: string;
    name: string;
    price: number | string;
    meetingPoint?: {
      id: string;
      name: string;
    } | null;
  };
  participants?: BookingParticipantItem[];
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateBookingPayload {
  scheduleId: string;
  packageId: string;
  contactName: string;
  contactWhatsapp: string;
  contactEmail?: string | null;
  source: BookingSource;
  participantCount: number;
  totalAmount?: number;
  status?: BookingStatus;
  notes?: string | null;
  participants?: Array<{
    fullName: string;
    dateOfBirth?: string | null;
    gender?: GenderType | null;
    phone?: string | null;
    identityType?: IdentityType | null;
    identityNumber?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    notes?: string | null;
  }>;
}

export interface UpdateBookingPayload {
  contactName?: string;
  contactWhatsapp?: string;
  contactEmail?: string | null;
  participantCount?: number;
  totalAmount?: number;
  notes?: string | null;
  cancellationReason?: string | null;
  status?: BookingStatus;
}

export interface CancelBookingPayload {
  cancellationReason?: string | null;
}

export interface BookingQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: BookingStatus;
  scheduleId?: string;
  tripId?: string;
  source?: BookingSource;
  sortOrder?: 'asc' | 'desc';
}

export interface BookingListResponse {
  items: AdminBookingItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PrivateTripStatus =
  'NEW' | 'CONTACTED' | 'QUOTATION_SENT' | 'NEGOTIATION' | 'BOOKED' | 'LOST';

export interface PrivateTripInquiry {
  id: string;
  inquiryNumber: string;
  mountainId: string | null;
  destinationOther: string | null;
  customerName: string;
  whatsappNumber: string;
  email: string | null;
  preferredDate: string;
  alternativeDate: string | null;
  participantCount: number;
  meetingPointRequest: string | null;
  budget: number | null;
  requirements: string | null;
  status: PrivateTripStatus;
  assignedAdminId: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  mountain?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreatePrivateTripInquiryPayload {
  destination?: string;
  mountainId?: string | null;
  destinationOther?: string | null;
  customerName: string;
  whatsappNumber: string;
  email?: string | null;
  preferredDate: string;
  alternativeDate?: string | null;
  participantCount: number;
  meetingPointRequest: string;
  budget?: number | null;
  requirements?: string | null;
}

export interface UpdatePrivateTripInquiryPayload {
  status?: PrivateTripStatus;
  assignedAdminId?: string | null;
  adminNotes?: string | null;
}

export interface PrivateTripInquiryQueryPayload {
  status?: PrivateTripStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PrivateTripInquiryListResponse {
  data: PrivateTripInquiry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FaqItem {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateFaqPayload {
  category?: string | null;
  question: string;
  answer: string;
  sortOrder?: number;
  status?: ContentStatus;
}

export interface UpdateFaqPayload {
  category?: string | null;
  question?: string;
  answer?: string;
  sortOrder?: number;
  status?: ContentStatus;
}

export interface FaqQueryPayload {
  category?: string;
  status?: ContentStatus | 'ALL';
  search?: string;
}

export interface ContentPageItem {
  id: string;
  pageKey: string;
  title: string;
  slug: string;
  content: string;
  status: ContentStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateContentPagePayload {
  pageKey: string;
  title: string;
  slug: string;
  content: string;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | Date | null;
}

export interface UpdateContentPagePayload {
  pageKey?: string;
  title?: string;
  slug?: string;
  content?: string;
  status?: ContentStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | Date | null;
}

export interface ContentPageQueryPayload {
  status?: ContentStatus | 'ALL';
  search?: string;
}

export interface AuditLogAdmin {
  id: string;
  name: string;
  email?: string;
}

export interface AuditLogItem {
  id: string;
  adminUserId: string | null;
  admin: AuditLogAdmin | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown | null;
  newValue: unknown | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
}

export interface AuditLogQueryPayload {
  adminUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLogItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'DISABLED';
  roles: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateAdminUserPayload {
  name?: string;
  roles?: string[];
  status?: 'ACTIVE' | 'DISABLED';
}

// --------------------------------------------------------------------------
// STEP 35 — Analytics Types & Contracts
// --------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'view_home'
  | 'view_trip_list'
  | 'view_trip'
  | 'select_schedule'
  | 'select_package'
  | 'click_book_whatsapp'
  | 'click_health_whatsapp'
  | 'private_trip_inquiry';

export interface AnalyticsEvent<T = Record<string, unknown>> {
  event: AnalyticsEventName;
  timestamp: string;
  properties?: T;
}
