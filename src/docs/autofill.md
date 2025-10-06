# Autofill PULL from Bearings

This feature computes PULL_ft from the two incident segment bearings at a pole.

## Field Collection (Inline)

- In Field Collection, each row now has inputs for `In°`, `Out°`, and `PULL (ft)` plus an `Autofill` button.
- Enter incoming and outgoing bearings (0–360). Optionally set `Span` (defaults to 100 ft when empty).
- Click `Autofill` to compute and populate `PULL (ft)` using PULL = S·sin(θ/2).
- The values are included in the Field Collection CSV exports (`incomingBearingDeg`, `outgoingBearingDeg`, `PULL_ft`).

## Usage (Button)

```jsx
import { AutoFillPullButton } from "@/components";

<AutoFillPullButton pole={pole} onUpdatePole={updatePole} baseSpanFt={100} />;
```

## Usage (Background)

```jsx
import { useAutoFillPull } from "@/hooks";

useAutoFillPull({
  pole,
  onUpdatePole: updatePole,
  baseSpanFt: 100,
  enabled: true,
});
```

Notes:

- θ is the included angle between bearings, clamped [0,180].
- PULL = S·sin(θ/2), default S=100 ft.
- Values are rounded to 0.01 ft for display.
