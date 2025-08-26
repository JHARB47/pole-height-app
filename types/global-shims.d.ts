// IDE type shims for JS project so editors don't flag missing types
// Vitest globals and module types
/// <reference types="vitest" />
declare module 'vitest';

// Zustand is JS-only here; declare modules to silence TS in editors
declare module 'zustand';
declare module 'zustand/middleware';
