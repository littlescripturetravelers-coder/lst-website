// Mirrors ../../../../tokens/*.css (design-system root). Keep in sync.
export const palette = {
  navy: '#1B2D5F', gold: '#F5C518', amber: '#D9A227', teal: '#5BD3DC', white: '#FFFFFF', linen: '#F4EFE6', oat: '#DFD2BE', captionNavy: '#5A6B93',
  area: {
    faith: ['#D9A227', '#F8EDCF'], marriage: ['#B5536B', '#F4E0E5'], girls: ['#D9823A', '#F9E6D3'], money: ['#3D7A58', '#DCEDE2'],
    health: ['#2E8C94', '#D8EEF0'], growth: ['#4F63A0', '#E0E5F3'], home: ['#7E6697', '#ECE4F1'],
  },
  success: ['#3D7A58', '#E4F1E8'], warning: ['#94440F', '#F8E9DA'], danger: ['#B43A2E', '#F9E2DE'],
} as const;
export type Area = keyof typeof palette.area;
export const space = { 1: 2, 2: 4, 3: 8, 4: 12, 5: 16, 6: 20, 7: 24, 8: 32, 9: 40, 10: 56, gutter: 20, row: 52, tap: 44 } as const;
export const radius = { xs: 4, chip: 6, sm: 8, card: 10, button: 10, lg: 14, sheet: 20, pill: 999 } as const;
export const type = {
  hero: { size: 40, line: 44 }, largeTitle: { size: 32, line: 38 }, title1: { size: 26, line: 32 }, title2: { size: 21, line: 27 },
  title3: { size: 19, line: 24 }, headline: { size: 17, line: 22 }, body: { size: 17, line: 24 }, callout: { size: 16, line: 22 },
  subhead: { size: 15, line: 20 }, footnote: { size: 13, line: 18 }, caption: { size: 12, line: 16 }, overline: { size: 11, line: 14, tracking: 1.5 }, shout: { size: 28, line: 30 },
} as const;
export const motion = { fast: 120, base: 200, slow: 320, sheet: 420, pressScale: 0.97 } as const;
