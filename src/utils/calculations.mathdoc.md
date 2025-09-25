# Calculations Math Reference

This document summarizes and validates the core engineering math used in `calculations.js`, with forward/inverse pair checks.

## Angle / Pull Relationship

Included angle θ between two spans: θ ∈ [0,180]. Pull proxy: `PULL = S * sin(θ/2)` where `S` is base span (ft). Inversion: `θ = 2 * arcsin(PULL / S)` guarded for floating-point drift by clamping ratio to [-1,1].

## Bearing Normalization / Included Angle

Bearings normalized to [0,360). Included angle = `min(|Δ|, 360 - |Δ|)` ensures ≤180°. Equivalent to smaller central angle between two rays.

## Sag Approximation

Parabolic approximation: `sag ≈ (w_eff * L^2) / (8 * T)` where `w_eff = sqrt(w_vert^2 + w_horiz^2)`. Adequate for preliminary make‑ready; exact catenary can be added later if higher fidelity required.

## Guy Load Heuristic

Heuristic horizontal load `= 0.1*T + windLoadOnSpan` kept conservative; future refinement could vectorize multi-span loads.

## Validation

Inverse tests confirm roundtrip θ→PULL→θ within <1e-9 for representative spans; sag monotonic with span and inverse with tension.

## Future Enhancements

1. Optional exact catenary.
2. Thermal expansion / tension adjustment.
3. Probabilistic wind+ice load envelopes.
4. Multi-span vector load model for guying.
