import { createNavigationContainerRef } from '@react-navigation/native';

export type RootTabParamList = {
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
  GeneratedContent: undefined;
  QuoteRequests: undefined;
  GivingSupport: undefined;
  StewardshipLedger: undefined;
};

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

// Overload for screens with params
export function navigateTo<Name extends keyof RootTabParamList>(
  name: Name,
  params?: RootTabParamList[Name]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name, params);
  }
}
