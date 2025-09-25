/**
 * @file composition-helpers.ts
 * @description Provides functional composition helpers: `pipe` and `compose`.
 * @note This code is taken from a boiler-plate created by Monde Sineke.
 * @author Your Name
 */

// Functional composition helpers using ES2025 features
export const pipe =
  (...fns: any[]) =>
  (value: any) =>
    fns.reduce((acc, fn) => fn(acc), value);

export const compose =
  (...fns: any[]) =>
  (value: any) =>
    fns.reduceRight((acc, fn) => fn(acc), value);
