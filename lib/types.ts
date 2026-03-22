export type BookingStatus =
  | "waiting"
  | "in_progress"
  | "done"
  | "cancelled"
  | "no_show";

export type ServiceCategory = "hair" | "beard" | "grooming" | "combo";

export type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  category?: ServiceCategory;
  created_at?: string;
  updated_at?: string;
};

export type Booking = {
  id: string;
  booking_reference: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  preferred_time_range?: string | null;
  note?: string | null;
  queue_number: number;
  status: BookingStatus;
  total_price: number;
  total_duration: number;
  extra_delay_minutes: number;
  is_walk_in: boolean;
  started_at?: string | null;
  created_at?: string;
  updated_at?: string;
  booking_services?: BookingService[];
};

export type BookingService = {
  id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  service?: Pick<Service, "name" | "price" | "duration_minutes"> &
    Partial<Pick<Service, "id" | "is_active">>;
};

export type ShopSettings = {
  id: string;
  shop_name: string;
  contact_number?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_open: boolean;
  buffer_minutes: number;
  updated_at?: string;
};

export type QueueSummary = {
  inProgress?: Booking | null;
  waiting: Booking[];
  completedToday: number;
  expectedEarnings: number;
  completedEarnings: number;
  averageWaitMinutes: number;
  totalWaiting: number;
  lastUpdated: string;
  shopSettings?: ShopSettings | null;
};
