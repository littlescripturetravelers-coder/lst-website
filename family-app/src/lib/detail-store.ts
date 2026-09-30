// Tiny store to hand an item (idea, health rule, birthday…) to the detail screen.
export type DetailItem = { title: string; area?: any; icon?: string; eyebrow?: string; meta?: string; why?: string; steps?: string[]; attachments?: { type: string; title: string; meta?: string; body: string[] }[]; onPlan?: () => void; actions?: { title: string; icon?: string; onPress: () => void }[] };
let current: DetailItem | null = null;
export const setDetail = (d: DetailItem) => { current = d; };
export const getDetail = () => current;
