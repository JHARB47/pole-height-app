import { useEffect, useRef } from "react";
import { computePullAutofill } from "@/utils/calculations.js";

export function useAutoFillPull({
  pole,
  onUpdatePole,
  baseSpanFt = 100,
  enabled = true,
}) {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !pole || appliedRef.current) return;
    const { incomingBearingDeg, outgoingBearingDeg } = pole;
    if (
      typeof incomingBearingDeg !== "number" ||
      typeof outgoingBearingDeg !== "number"
    )
      return;
    const { pullFt } = computePullAutofill({
      incomingBearingDeg,
      outgoingBearingDeg,
      baseSpanFt,
    });
    onUpdatePole?.({ ...pole, PULL_ft: Math.round(pullFt * 100) / 100 });
    appliedRef.current = true;
  }, [enabled, pole, baseSpanFt, onUpdatePole]);
}
