import { describe, it, expect } from "vitest";
import { buildManifest, csvFrom } from "./manifests";

const samplePoles = [
  {
    id: "P1",
    latitude: 39.1,
    longitude: -80.1,
    height: 40,
    poleClass: 4,
    powerHeight: 28,
    voltage: "distribution",
    hasTransformer: false,
    spanDistance: 150,
    adjacentPoleHeight: 40,
    attachmentType: "communication",
    status: "done",
    photoDataUrl: "data:image/png;base64,abc",
    timestamp: "2024-01-01T00:00:00Z",
    jobId: "J1",
  },
  {
    id: "P2",
    latitude: 39.2,
    longitude: -80.2,
    height: 45,
    poleClass: 3,
    powerHeight: 30,
    voltage: "distribution",
    hasTransformer: true,
    spanDistance: 180,
    adjacentPoleHeight: 45,
    attachmentType: "communication",
    status: "draft",
    photoDataUrl: "",
    timestamp: "2024-01-02T00:00:00Z",
    jobId: "J1",
  },
];

const job = { id: "J1", commCompany: "Acme Fiber" };

describe("manifests", () => {
  it("builds FE manifest shape", () => {
    const { header, rows, fileLabel } = buildManifest(
      "firstEnergy",
      samplePoles,
      job,
    );
    expect(fileLabel).toContain("fe");
    expect(header[0]).toBe("id");
    expect(rows.length).toBe(2);
    const csv = csvFrom(header, rows);
    expect(csv.split("\n").length).toBe(3);
  });

  it("builds AEP manifest shape", () => {
    const { header, rows, fileLabel } = buildManifest("aep", samplePoles, job);
    expect(fileLabel).toContain("aep");
    expect(header[0]).toBe("PoleID");
    expect(rows[0][0]).toBe("P1");
  });

  it("builds Duke manifest shape", () => {
    const { header, rows, fileLabel } = buildManifest("duke", samplePoles, job);
    expect(fileLabel).toContain("duke");
    expect(header[0]).toBe("PoleTag");
    expect(rows[0][0]).toBe("P1");
  });

  it("builds generic manifest shape", () => {
    const { header, rows, fileLabel } = buildManifest(
      "generic",
      samplePoles,
      job,
    );
    expect(fileLabel).toContain("utility");
    expect(header[0]).toBe("id");
    expect(rows[1][0]).toBe("P2");
  });
});
