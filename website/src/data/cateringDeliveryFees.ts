// Simple distance-tier delivery pricing for catering checkout. Manual tier
// selection for now (no live geocoding/distance-matrix integration) — swap
// these numbers, or wire an admin-editable version, without touching the
// checkout UI itself.
export interface CateringDeliveryTier {
  id: string;
  label: string;
  fee: number;
}

export const CATERING_DELIVERY_TIERS: CateringDeliveryTier[] = [
  { id: "near", label: "Within 10 miles", fee: 15 },
  { id: "mid", label: "10 - 20 miles", fee: 30 },
  { id: "far", label: "20+ miles", fee: 50 },
];
