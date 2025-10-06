import { describe, it, expect } from "vitest";

describe("test runner setup", () => {
  it("runs a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has a jsdom document", () => {
    expect(typeof document).toBe("object");
    const div = document.createElement("div");
    div.id = "root";
    document.body.appendChild(div);
    expect(document.getElementById("root")).toBe(div);
  });
});
