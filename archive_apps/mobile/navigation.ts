import { createNavigationContainerRef } from '@react-navigation/native';

export type RootTabParamList = {
  ContinuityHome: undefined;
  Home: undefined;
  Opportunities: undefined;
  Timeline: undefined;
  ReplayEventDetail: { eventId: string };
  EntityReplay: { entityId: string; entityType: string };
  GraphReplay: { eventId: string; direction?: 'upstream' | 'downstream' | 'both'; maxDepth?: number };
  More: undefined;
  Profile: undefined;
  Campaigns: undefined;
  Media: undefined;
  Location: undefined;
  Reflections: undefined;
  Scripture: undefined;
  Templates: undefined;
  QuoteRequestForm: {
    business_owner_id: string;
    business_category_key: string;
    business_line: string;
    post_id: string;
    business_name?: string;
    business_subtitle?: string;
  };
  QuoteRequestsDashboard: undefined;
  ContentGenerator: undefined;
  QuoteRequests: undefined;
  GivingSupport: undefined;
  StewardshipLedger: undefined;
  InventoryLedger: undefined;
  PaymentReview: undefined;
  InventoryReplay: { itemId: string };
  LeadQuoteCapture: { postId?: string };
  CommissionLedger: undefined;
  ContinuityInbox: undefined; // Quiet pilot surface
};

export type RootStackParamList = {
  AuthenticatedTabs: undefined;
  DocumentComposer: { opportunity_id?: string; target_continuity_event_id?: string } | undefined;
  MediaIngestion: { opportunity_id?: string; target_continuity_event_id?: string } | undefined;
  AboutUs: undefined;
  Acknowledgements: undefined;
  Music: undefined;
  ContinuityPrinciples: undefined;
  Support: undefined;
};

export type GlobalParamList = RootTabParamList & RootStackParamList;

export const navigationRef = createNavigationContainerRef<GlobalParamList>();

// Overload for screens with params
export function navigateTo<Name extends keyof GlobalParamList>(
  name: Name,
  params?: GlobalParamList[Name]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name, params);
  }
}
