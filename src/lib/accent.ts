export const ACCENTS = ["blue", "indigo", "teal", "purple", "rose", "orange"] as const;
export type Accent = (typeof ACCENTS)[number];
export const ACCENT_KEY = "accent";

/** Runs before paint (inlined in <head>) so a saved accent never flashes blue first. */
export const ACCENT_BOOT_SCRIPT = `try{var a=localStorage.getItem('${ACCENT_KEY}');if(a&&a!=='blue'&&${JSON.stringify(ACCENTS)}.indexOf(a)>-1)document.documentElement.setAttribute('data-accent',a)}catch(e){}`;
