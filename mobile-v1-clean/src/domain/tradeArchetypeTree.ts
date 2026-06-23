export type TradeArchetype = {
  id: string;
  name: string;
};

export type ArchetypeGroup = {
  title: string;
  items: TradeArchetype[];
};

export function getArchetypeGroups(): ArchetypeGroup[] {
  return [
    {
      title: "Default Group",
      items: [
        { id: "1", name: "General User" },
        { id: "2", name: "Admin" }
      ]
    }
  ];
}
