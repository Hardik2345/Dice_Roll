// Admin-related types for the funnel dashboard
export interface FunnelEvent {
  _id: string;
  mobile: string;
  eventType: string;
  timestamp: string;
  userId?: string;
  name?: string;
  discountCode?: string;
}

export interface FunnelStats {
  [eventType: string]: { count: number; events: FunnelEvent[] };
}
