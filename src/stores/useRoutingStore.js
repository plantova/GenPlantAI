/**
 * Routing Store — Zustand state for the pipe routing workflow
 */

import { create } from 'zustand';

const useRoutingStore = create((set) => ({
  // ─── State ───

  /** Pending route definition, null when idle */
  pendingRoute: null, // { from: [x,y,z], to: [x,y,z], lineData: { lineNumber, nominalSize, schedule, material, designTemp, designPressure } }

  /** Whether the routing engine is currently computing */
  routingInProgress: false,

  /** Last computed route result, null until a route is computed */
  routeResult: null, // { success, segments, totalLength, elbowCount90, elbowCount45, flexibilityStatus, errors }

  /** Routing error messages */
  routeErrors: [],

  // ─── Actions ───

  /**
   * Initiate a new routing request.
   * @param {number[]} from - Start position [x,y,z] in world coords
   * @param {number[]} to   - End position [x,y,z] in world coords
   * @param {object} lineData - Pipe line metadata
   */
  startRoute: (from, to, lineData) =>
    set({
      pendingRoute: { from, to, lineData },
      routeResult: null,
      routeErrors: [],
      routingInProgress: false,
    }),

  /**
   * Set routing-in-progress flag.
   * @param {boolean} inProgress
   */
  setRouting: (inProgress) =>
    set({ routingInProgress: inProgress }),

  /**
   * Store the computed route result.
   * @param {object} result
   */
  setResult: (result) =>
    set({
      routeResult: result,
      routingInProgress: false,
    }),

  /**
   * Store routing errors.
   * @param {string[]} errors
   */
  setErrors: (errors) =>
    set({
      routeErrors: errors,
      routingInProgress: false,
    }),

  /** Clear the current route result without clearing the pending route. */
  clearResult: () =>
    set({
      routeResult: null,
      routeErrors: [],
    }),

  /** Cancel any pending or in-progress routing. */
  cancelRoute: () =>
    set({
      pendingRoute: null,
      routeResult: null,
      routeErrors: [],
      routingInProgress: false,
    }),
}));

export default useRoutingStore;
