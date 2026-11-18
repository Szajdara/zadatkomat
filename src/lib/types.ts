export type IndustryType = 'tattoo' | 'detailing' | 'groomer' | 'other';

export type StudioPlan = 'START' | 'PRO';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED_FORFEITED'
  | 'COMPLETED';

export type PaymentMethodType = 'BLIK_CODE' | 'BLIK_PHONE_TRANSFER' | 'STRIPE';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  depositAmount: number;
  durationMinutes: number;
}

export interface Studio {
  id: string;
  slug: string;
  name: string;
  industry: IndustryType;
  city: string;
  instagram: string;
  phone: string;
  blikPhone?: string;
  bankAccount?: string;
  nip?: string;
  proExpiresAt?: string;
  ownerEmail: string;
  passwordHash?: string;
  isDemo?: boolean;
  plan: StudioPlan;
  cancelPolicyHours: number;
  bio: string;
  services: ServiceItem[];
  createdAt: string;
}

export interface Booking {
  id: string;
  shortCode: string;
  studioId: string;
  studioSlug: string;
  studioName: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientNotes: string;
  customFieldLabel: string;
  customFieldValue: string;
  date: string;
  time: string;
  totalPrice: number;
  depositAmount: number;
  serviceFee: number;
  stripeFeeEstimate: number;
  platformNetProfit: number;
  status: BookingStatus;
  source: 'IG_LINK' | 'PUBLIC_PROFILE';
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
  paymentProvider?: 'DEMO_BLIK' | 'STRIPE_BLIK' | 'PHONE_BLIK';
  paymentMethod?: PaymentMethodType;
  transferDeclared?: boolean;
  stripeSessionId?: string;
  cancelRequested?: boolean;
  cancelReason?: string;
}

export interface WaitlistEntry {
  id: string;
  studioId: string;
  studioSlug: string;
  clientName: string;
  clientPhone: string;
  preferredService: string;
  preferredDays: string;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: string;
  studioId: string;
  studioName: string;
  nip: string;
  companyName: string;
  amount: number;
  blikCodeLast2: string;
  invoiceNumber: string;
  createdAt: string;
}

export interface PlatformConfig {
  stripeSecretKey?: string;
  platformBlikPhone: string;
  platformBankAccount: string;
  resendApiKey?: string;
  smsApiToken?: string;
  serviceFeePln: number;
  proPlanPricePln: number;
}

export interface PlatformStats {
  totalStudios: number;
  startStudios: number;
  proStudios: number;
  totalBookings: number;
  paidBookingsCount: number;
  paidWithFeeCount: number;
  pendingBookingsCount: number;
  forfeitedBookingsCount: number;
  totalDepositsProcessed: number;
  totalServiceFeesCollected: number;
  totalStripeFeesEstimate: number;
  totalTransactionNetProfit: number;
  monthlyMrrRevenue: number;
  totalPlatformRevenue: number;
}

export interface DatabaseState {
  studios: Studio[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  subscriptions: SubscriptionPayment[];
  config: PlatformConfig;
}
