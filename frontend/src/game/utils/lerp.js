export function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

export function hexToNumber(hexStr) {
  return parseInt(hexStr.replace('#', ''), 16);
}

export const DINO_COLOR_HEXES = [
  '#4CAF50', '#2196F3', '#F44336', '#FF9800',
  '#9C27B0', '#E91E63', '#00BCD4', '#FFEB3B',
  '#795548', '#607D8B', '#8BC34A', '#3F51B5',
  '#FF5722', '#009688', '#673AB7', '#FFC107'
];

export function getDinoColorHex(colorId) {
  return DINO_COLOR_HEXES[colorId % DINO_COLOR_HEXES.length] || '#4CAF50';
}
