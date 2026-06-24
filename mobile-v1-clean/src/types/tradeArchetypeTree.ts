export interface TradeArchetype {
  key: string;
  label: string;
  features?: any;
}

export interface ArchetypeGroup {
  key: string;
  label: string;
  title: string;
  description: string;
  archetypes: TradeArchetype[];
}

export function getArchetypeGroups(): ArchetypeGroup[] {
  return [
    {
      key: "services",
      title: "Services",
      label: "Services",
      description: "Local community services.",
      archetypes: [
        { key: "hair_beauty", label: "Hair & Beauty" },
        { key: "home_services", label: "Home Services" }
      ]
    },
    {
      key: "trades",
      title: "Trades",
      label: "Trades",
      description: "Construction and mechanical trades.",
      archetypes: [
        { key: "construction_trades", label: "Construction & Trades" },
        { key: "mechanic_auto", label: "Mechanic / Auto" }
      ]
    },
    {
      key: "business",
      title: "Business",
      label: "Business",
      description: "Retail and food services.",
      archetypes: [
        { key: "retail_trading", label: "Retail & Trading" },
        { key: "food_catering", label: "Food & Catering" }
      ]
    },
    {
      key: "digital",
      title: "Digital",
      label: "Digital",
      description: "Tech, education, and media.",
      archetypes: [
        { key: "tech_digital", label: "Tech & Digital" },
        { key: "education_training", label: "Education & Training" },
        { key: "events_media", label: "Events & Media" }
      ]
    },
    {
      key: "mobility",
      title: "Mobility",
      label: "Mobility",
      description: "Transport and delivery services.",
      archetypes: [
        { key: "transport_delivery", label: "Transport & Delivery" }
      ]
    }
  ];
}
