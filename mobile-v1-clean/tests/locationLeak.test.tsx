import { render } from "@testing-library/react-native";
import Profile from "../app/tabs/profile";

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: jest.fn() })
}));

jest.mock('../src/context/StewardContext', () => ({
  useSteward: () => ({ profile: null })
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  Link: ({ children }: any) => children
}));

const FREE_TEXT_PATTERNS = [
  "city:",
  "province:",
  "suburb:",
  "locationText",
  "string location",
];

describe("Stats-SA Location Enforcement", () => {
  it("should not contain legacy string-based location inputs", () => {
    // Note: Profile screen must handle context providers internally for this render.
    const tree = render(<Profile />);

    const output = JSON.stringify(tree.toJSON());

    FREE_TEXT_PATTERNS.forEach((pattern) => {
      expect(output).not.toContain(pattern);
    });
  });
});
