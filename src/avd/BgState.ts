export class BgState {
  currentKey: string | null = null;
  currentBgmKey: string | null = null;
  textureMap: Record<string, any> = {};
  lazyLoad: ((key: string) => Promise<any>) | null = null;

  setLazyLoad(fn: (key: string) => Promise<any>): void { this.lazyLoad = fn; }
}
