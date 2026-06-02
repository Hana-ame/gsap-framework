export interface MetaTag {
  name?: string;
  property?: string;
  httpEquiv?: string;
  content: string;
}

export interface HeadConfig {
  title: string;
  description?: string;
  meta?: MetaTag[];
}

export const FALLBACK_HEAD: HeadConfig = {
  title: 'sim',
  description: 'Vite + React 19 + PixiJS v8 + Three.js 2D/3D sandbox',
};
