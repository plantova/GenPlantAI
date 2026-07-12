/**
 * Sample Refinery Layout — Pre-positioned equipment for one-click demo
 * A simplified crude distillation unit with proper tag numbers
 */
import { getDefaultDimensions, getDefaultNozzles } from './library.js';

export const SAMPLE_LAYOUT = [
  // ── Distillation Column ──────────────────────────────────
  {
    type: 'column',
    tag:  'C-101',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    dimensions: { diameter: 3.5, height: 38, wallThickness: 0.025 },
    color: '#6688aa',
    designTemperature: 360,
    designPressure: 3.5,
  },
  // ── Reflux Drum ──────────────────────────────────────────
  {
    type: 'horizontalVessel',
    tag:  'V-101',
    position: [18, 0, -6],
    rotation: [0, 0, 0],
    dimensions: { diameter: 2.0, length: 6.0, saddleWidth: 0.4, saddleHeight: 1.2 },
    color: '#7a9a8a',
    designTemperature: 80,
    designPressure: 1.8,
  },
  // ── Feed Pre-heat Exchanger ───────────────────────────────
  {
    type: 'horizontalVessel',
    tag:  'E-101',
    position: [-18, 0, -8],
    rotation: [0, 0, 0],
    dimensions: { diameter: 1.2, length: 5.0, saddleWidth: 0.35, saddleHeight: 1.0 },
    color: '#8a7a6a',
    designTemperature: 280,
    designPressure: 5.0,
  },
  // ── Crude Furnace ─────────────────────────────────────────
  {
    type: 'sruFurnace',
    tag:  'F-101',
    position: [-38, 0, 0],
    rotation: [0, 0, 0],
    dimensions: { width: 8, depth: 5, height: 10, stackDiameter: 2.2, stackHeight: 22 },
    color: '#aa7766',
    designTemperature: 380,
    designPressure: 4.0,
  },
  // ── Overhead Air Cooler ───────────────────────────────────
  {
    type: 'airCooler',
    tag:  'AC-101',
    position: [18, 0, 14],
    rotation: [0, 0, 0],
    dimensions: { width: 10, depth: 3, height: 4, fanCount: 4, fanDiameter: 2.2 },
    color: '#6699aa',
    designTemperature: 90,
    designPressure: 1.8,
  },
  // ── Crude Storage Tank ────────────────────────────────────
  {
    type: 'sphericalTank',
    tag:  'TK-101',
    position: [-52, 0, 22],
    rotation: [0, 0, 0],
    dimensions: { diameter: 14, legCount: 8, legHeight: 6, legDiameter: 0.5 },
    color: '#aa8877',
    designTemperature: 60,
    designPressure: 0.5,
  },
  // ── LPG Drum ─────────────────────────────────────────────
  {
    type: 'sphericalTank',
    tag:  'TK-102',
    position: [-38, 0, 32],
    rotation: [0, 0, 0],
    dimensions: { diameter: 8, legCount: 6, legHeight: 4, legDiameter: 0.4 },
    color: '#aa9966',
    designTemperature: 45,
    designPressure: 8.0,
  },
  // ── Bottoms Stripper ─────────────────────────────────────
  {
    type: 'column',
    tag:  'C-102',
    position: [20, 0, -26],
    rotation: [0, 0, 0],
    dimensions: { diameter: 2.2, height: 22, wallThickness: 0.022 },
    color: '#6677aa',
    designTemperature: 300,
    designPressure: 2.5,
  },
  // ── Bottoms Cooler ────────────────────────────────────────
  {
    type: 'airCooler',
    tag:  'AC-102',
    position: [36, 0, -26],
    rotation: [0, 0, 0],
    dimensions: { width: 7, depth: 2.5, height: 3.5, fanCount: 3, fanDiameter: 2.0 },
    color: '#6699aa',
    designTemperature: 120,
    designPressure: 2.5,
  },
  // ── Feed Surge Drum ───────────────────────────────────────
  {
    type: 'horizontalVessel',
    tag:  'V-102',
    position: [-18, 0, 16],
    rotation: [0, Math.PI / 2, 0],
    dimensions: { diameter: 2.4, length: 7.0, saddleWidth: 0.45, saddleHeight: 1.4 },
    color: '#7a9a6a',
    designTemperature: 120,
    designPressure: 3.0,
  },
].map((item) => ({
  ...item,
  nozzles: getDefaultNozzles(item.type),
}));

export const SAMPLE_STRUCTURE = {
  tag: 'PRC-101',
  type: 'pipeRack',
  position: [-10, 0, 8],
  rotation: [0, 0, 0],
  baysX: 8,
  baysZ: 1,
  bayWidth: 6,
  bayLength: 4,
  levels: [
    { elevation: 4,  label: 'Level 1' },
    { elevation: 8,  label: 'Level 2' },
    { elevation: 12, label: 'Level 3' },
  ],
  columnSize: { w: 0.35, d: 0.35 },
  beamSize:   { w: 0.30, h: 0.45 },
  color: '#5a6a7a',
};
