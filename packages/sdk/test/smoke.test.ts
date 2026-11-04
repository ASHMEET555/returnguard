import { describe, it, expect } from "vitest";
import { SDK_VERSION, getVersion } from "../src/index";

describe("Smoke test", () => {
  it("exports correct version", () => {
    expect(SDK_VERSION).toBe("0.1.0");
    expect(getVersion()).toBe("0.1.0");
  });
});
