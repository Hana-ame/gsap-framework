import * as PIXI from 'pixi.js';

// Mapped from ExHentai gallery https://ex.moonchan.xyz/g/3631029/8a2a08b248/
export const IMAGE_MAP: Record<string, string> = {
  'HA1-1': 'https://ex.moonchan.xyz/s/c1491b9616/3631029-6?redirect_to=image',
  'HA1-2': 'https://ex.moonchan.xyz/s/4dd8df8987/3631029-7?redirect_to=image',
  'HA1-3': 'https://ex.moonchan.xyz/s/e36c56dcfd/3631029-8?redirect_to=image',
  'HA1-3^': 'https://ex.moonchan.xyz/s/02e1207368/3631029-9?redirect_to=image',
  'HA1-4': 'https://ex.moonchan.xyz/s/0f580b0d53/3631029-10?redirect_to=image',
  'HA1-5': 'https://ex.moonchan.xyz/s/1c9ac39ec7/3631029-11?redirect_to=image',
  'HA2-3': 'https://ex.moonchan.xyz/s/87276f0df2/3631029-12?redirect_to=image',
  'HA3-1': 'https://ex.moonchan.xyz/s/f1d9d6d691/3631029-13?redirect_to=image',
  'HA3-2': 'https://ex.moonchan.xyz/s/32b52670c4/3631029-14?redirect_to=image',
  'HA3-3': 'https://ex.moonchan.xyz/s/2c47bd60e2/3631029-15?redirect_to=image',
  'HA3-4': 'https://ex.moonchan.xyz/s/10adf89f2b/3631029-16?redirect_to=image',
  'HB1-1': 'https://ex.moonchan.xyz/s/8a54ffc5e6/3631029-17?redirect_to=image',
  'HB1-2': 'https://ex.moonchan.xyz/s/0cb53a175e/3631029-18?redirect_to=image',
  'HB1-3': 'https://ex.moonchan.xyz/s/3b41b81641/3631029-19?redirect_to=image',
  'HB1-4': 'https://ex.moonchan.xyz/s/9fb81f336b/3631029-20?redirect_to=image',
  'HB1-5': 'https://ex.moonchan.xyz/s/277d0ecac4/3631029-21?redirect_to=image',
  'HB1-6': 'https://ex.moonchan.xyz/s/a13139c517/3631029-22?redirect_to=image',
  'HB1-7': 'https://ex.moonchan.xyz/s/7d1a837940/3631029-23?redirect_to=image',
  'HB1-8': 'https://ex.moonchan.xyz/s/9bb900a41a/3631029-24?redirect_to=image',
  'HB1-9': 'https://ex.moonchan.xyz/s/a21414e238/3631029-25?redirect_to=image',
  'HB2-1': 'https://ex.moonchan.xyz/s/39a3de7a28/3631029-26?redirect_to=image',
  'HB2-2': 'https://ex.moonchan.xyz/s/1533e41a81/3631029-27?redirect_to=image',
  'HB2-3': 'https://ex.moonchan.xyz/s/2857f8673c/3631029-28?redirect_to=image',
  'HB2-4': 'https://ex.moonchan.xyz/s/3195d12602/3631029-29?redirect_to=image',
  'HC1-1': 'https://ex.moonchan.xyz/s/f75b650daf/3631029-30?redirect_to=image',
  'HC1-2': 'https://ex.moonchan.xyz/s/3fcb2c376a/3631029-31?redirect_to=image',
  'HC1-3': 'https://ex.moonchan.xyz/s/944f484a0e/3631029-32?redirect_to=image',
  'HC1-4': 'https://ex.moonchan.xyz/s/a0255a7e7a/3631029-33?redirect_to=image',
  'HC1-5': 'https://ex.moonchan.xyz/s/d00c790032/3631029-34?redirect_to=image',
  'HC1-6': 'https://ex.moonchan.xyz/s/8f7063ec2d/3631029-35?redirect_to=image',
  'HC1-7': 'https://ex.moonchan.xyz/s/289f3fa693/3631029-36?redirect_to=image',
  'HC1-8': 'https://ex.moonchan.xyz/s/0deaa49e4a/3631029-37?redirect_to=image',
  'HC2-1': 'https://ex.moonchan.xyz/s/40030a081a/3631029-38?redirect_to=image',
  'HC2-2': 'https://ex.moonchan.xyz/s/16ea759a5e/3631029-39?redirect_to=image',
  'HC2-3': 'https://ex.moonchan.xyz/s/eac37e7c65/3631029-40?redirect_to=image',
  'HC2-4': 'https://ex.moonchan.xyz/s/045c6e3728/3631029-41?redirect_to=image',
  'HC2-5': 'https://ex.moonchan.xyz/s/7baaad46a9/3631029-42?redirect_to=image',
  'HC2-6': 'https://ex.moonchan.xyz/s/a554792d8d/3631029-43?redirect_to=image',
  'HC2-7': 'https://ex.moonchan.xyz/s/ef9e03bc0a/3631029-44?redirect_to=image',
  'HC2-8': 'https://ex.moonchan.xyz/s/01bee094d2/3631029-45?redirect_to=image',
  'HC3-1': 'https://ex.moonchan.xyz/s/cdf14c8109/3631029-46?redirect_to=image',
  'HC3-2': 'https://ex.moonchan.xyz/s/ebcb37fd5a/3631029-47?redirect_to=image',
  'HC3-2^': 'https://ex.moonchan.xyz/s/8d765924a1/3631029-48?redirect_to=image',
  'HC3-3': 'https://ex.moonchan.xyz/s/2d5cada725/3631029-49?redirect_to=image',
  'HC3-4': 'https://ex.moonchan.xyz/s/b06c917973/3631029-50?redirect_to=image',
  'HC3-5': 'https://ex.moonchan.xyz/s/b37824e07d/3631029-51?redirect_to=image',
  'HC3-6': 'https://ex.moonchan.xyz/s/22ae110a67/3631029-52?redirect_to=image',
  'HC3-7': 'https://ex.moonchan.xyz/s/0b52d35906/3631029-53?redirect_to=image',
  'HC3-8': 'https://ex.moonchan.xyz/s/a76f9cfe25/3631029-54?redirect_to=image',
  'HC3-9': 'https://ex.moonchan.xyz/s/93fb64fe93/3631029-55?redirect_to=image',
  'HD1-1': 'https://ex.moonchan.xyz/s/1c02dcab08/3631029-56?redirect_to=image',
  'HD1-2': 'https://ex.moonchan.xyz/s/3fc7677979/3631029-57?redirect_to=image',
  'HD1-3': 'https://ex.moonchan.xyz/s/78c833d084/3631029-58?redirect_to=image',
  'HD1-4': 'https://ex.moonchan.xyz/s/b122c8a2ba/3631029-59?redirect_to=image',
  'HD1-5': 'https://ex.moonchan.xyz/s/02260d435b/3631029-60?redirect_to=image',
  'HD1-6': 'https://ex.moonchan.xyz/s/0f69954bab/3631029-61?redirect_to=image',
  'HD1-7': 'https://ex.moonchan.xyz/s/947e28bf6c/3631029-62?redirect_to=image',
  'HD1-8': 'https://ex.moonchan.xyz/s/dd332b2f57/3631029-63?redirect_to=image',
  'HD1-9': 'https://ex.moonchan.xyz/s/73283a9d71/3631029-64?redirect_to=image',
  'HD2-1': 'https://ex.moonchan.xyz/s/1d15041ed9/3631029-65?redirect_to=image',
  'HD2-2': 'https://ex.moonchan.xyz/s/b43e8b40cd/3631029-66?redirect_to=image',
  'HD2-3': 'https://ex.moonchan.xyz/s/1b65b9d7f9/3631029-67?redirect_to=image',
  'HD2-4': 'https://ex.moonchan.xyz/s/1d19bc7de4/3631029-68?redirect_to=image',
  'HD2-5': 'https://ex.moonchan.xyz/s/2a21f4f0e7/3631029-69?redirect_to=image',
  'HD2-6': 'https://ex.moonchan.xyz/s/49b8a87abe/3631029-70?redirect_to=image',
  'HD2-7': 'https://ex.moonchan.xyz/s/701fc59364/3631029-71?redirect_to=image',
  'HD3-1': 'https://ex.moonchan.xyz/s/6fdf522b19/3631029-72?redirect_to=image',
  'HD3-2': 'https://ex.moonchan.xyz/s/9f9ea94b5e/3631029-73?redirect_to=image',
  'HD3-3': 'https://ex.moonchan.xyz/s/963b8ff326/3631029-74?redirect_to=image',
  'HD3-4': 'https://ex.moonchan.xyz/s/7b1600df4a/3631029-75?redirect_to=image',
  'HD3-5': 'https://ex.moonchan.xyz/s/047baf0014/3631029-76?redirect_to=image',
  'HD3-6': 'https://ex.moonchan.xyz/s/a06bbd149b/3631029-77?redirect_to=image',
  'HE1-1': 'https://ex.moonchan.xyz/s/d3094a726d/3631029-78?redirect_to=image',
  'HE1-2': 'https://ex.moonchan.xyz/s/499603d7d2/3631029-79?redirect_to=image',
  'HE1-3': 'https://ex.moonchan.xyz/s/6893e76b59/3631029-80?redirect_to=image',
  'HE1-4': 'https://ex.moonchan.xyz/s/49080bd0b1/3631029-81?redirect_to=image',
  'HE1-5': 'https://ex.moonchan.xyz/s/bc03e53e15/3631029-82?redirect_to=image',
  'HE1-5^': 'https://ex.moonchan.xyz/s/04ebff8783/3631029-83?redirect_to=image',
  'HE1-6': 'https://ex.moonchan.xyz/s/7c68e095f3/3631029-84?redirect_to=image',
  'HE1-7': 'https://ex.moonchan.xyz/s/ad3a3bbab3/3631029-85?redirect_to=image',
  'HE1-8': 'https://ex.moonchan.xyz/s/a9c5cbf61e/3631029-86?redirect_to=image',
  'HE1-9': 'https://ex.moonchan.xyz/s/a3e2286c7b/3631029-87?redirect_to=image',
  'HE1-10': 'https://ex.moonchan.xyz/s/5fc2b10d5d/3631029-88?redirect_to=image',
  'HE1-11': 'https://ex.moonchan.xyz/s/5dcfd26749/3631029-89?redirect_to=image',
  'HE1-13': 'https://ex.moonchan.xyz/s/d33dd1330f/3631029-90?redirect_to=image',
  'HE1-14': 'https://ex.moonchan.xyz/s/f3319b6bc2/3631029-91?redirect_to=image',
  'HE2-1': 'https://ex.moonchan.xyz/s/f7da9341ec/3631029-92?redirect_to=image',
  'HE2-2': 'https://ex.moonchan.xyz/s/2d9af99584/3631029-93?redirect_to=image',
  'HE2-3': 'https://ex.moonchan.xyz/s/64fda42b4d/3631029-94?redirect_to=image',
  'HE2-4': 'https://ex.moonchan.xyz/s/242c17b857/3631029-95?redirect_to=image',
  'HE2-5': 'https://ex.moonchan.xyz/s/4f82d87a18/3631029-96?redirect_to=image',
  'HE2-6': 'https://ex.moonchan.xyz/s/4273c119ca/3631029-97?redirect_to=image',
  'HF1-1': 'https://ex.moonchan.xyz/s/15a3b7d2bb/3631029-98?redirect_to=image',
  'HF1-2': 'https://ex.moonchan.xyz/s/4302397f15/3631029-99?redirect_to=image',
  'HF1-3': 'https://ex.moonchan.xyz/s/acc2d7e36a/3631029-100?redirect_to=image',
  'HF1-4': 'https://ex.moonchan.xyz/s/122d5e313f/3631029-101?redirect_to=image',
  'HF1-5': 'https://ex.moonchan.xyz/s/a6c311a505/3631029-102?redirect_to=image',
  'HF1-6': 'https://ex.moonchan.xyz/s/c3e66c03fd/3631029-103?redirect_to=image',
  'HF1-7': 'https://ex.moonchan.xyz/s/b7d894de07/3631029-104?redirect_to=image',
  'HG1-1': 'https://ex.moonchan.xyz/s/ac69bf9bf0/3631029-105?redirect_to=image',
  'HG1-2': 'https://ex.moonchan.xyz/s/06246ae989/3631029-106?redirect_to=image',
  'HG1-2^': 'https://ex.moonchan.xyz/s/de3b77a887/3631029-107?redirect_to=image',
  'HG1-3': 'https://ex.moonchan.xyz/s/0a1f42c2cb/3631029-108?redirect_to=image',
  'HG1-4': 'https://ex.moonchan.xyz/s/37d93d9ac0/3631029-109?redirect_to=image',
  'HG1-5': 'https://ex.moonchan.xyz/s/ec99806176/3631029-110?redirect_to=image',
  'T1-1': 'https://ex.moonchan.xyz/s/b2c84757b0/3631029-111?redirect_to=image',
  'T1-2': 'https://ex.moonchan.xyz/s/dda51f38ed/3631029-112?redirect_to=image',
  'T1-3': 'https://ex.moonchan.xyz/s/fa2980f542/3631029-113?redirect_to=image',
  'T21-0': 'https://ex.moonchan.xyz/s/871f437378/3631029-119?redirect_to=image',
  'T21-1': 'https://ex.moonchan.xyz/s/2a3e6bad62/3631029-120?redirect_to=image',
  'T21-2': 'https://ex.moonchan.xyz/s/f4f2863867/3631029-121?redirect_to=image',
  'T21-3': 'https://ex.moonchan.xyz/s/8ca7420351/3631029-122?redirect_to=image',
  'T21-4': 'https://ex.moonchan.xyz/s/cb2d51e86c/3631029-123?redirect_to=image',
  'T22-0': 'https://ex.moonchan.xyz/s/cb12c63de5/3631029-124?redirect_to=image',
  'T22-0^': 'https://ex.moonchan.xyz/s/fde13da668/3631029-125?redirect_to=image',
  'T22-1': 'https://ex.moonchan.xyz/s/e734c4182f/3631029-126?redirect_to=image',
  'T22-1^': 'https://ex.moonchan.xyz/s/775511cb33/3631029-127?redirect_to=image',
  'T22-2': 'https://ex.moonchan.xyz/s/1176c5be5d/3631029-128?redirect_to=image',
  'T22-2^': 'https://ex.moonchan.xyz/s/875454f691/3631029-129?redirect_to=image',
  'T22-3': 'https://ex.moonchan.xyz/s/28cddb5456/3631029-130?redirect_to=image',
  'T22-4': 'https://ex.moonchan.xyz/s/7bb53ddaf2/3631029-131?redirect_to=image',
  'T3-1': 'https://ex.moonchan.xyz/s/1f675aa53a/3631029-114?redirect_to=image',
  'T3-2': 'https://ex.moonchan.xyz/s/fc382888b0/3631029-115?redirect_to=image',
  'T3-3': 'https://ex.moonchan.xyz/s/ba9d25c15a/3631029-116?redirect_to=image',
  'T3-4': 'https://ex.moonchan.xyz/s/4e2a6f3870/3631029-117?redirect_to=image',
  'T3-5': 'https://ex.moonchan.xyz/s/f8c14dac5c/3631029-118?redirect_to=image',
  'z_e': 'https://ex.moonchan.xyz/s/371fbfa41f/3631029-163?redirect_to=image',
  'z_e2': 'https://ex.moonchan.xyz/s/62c07a8898/3631029-164?redirect_to=image',
  'z_ht': 'https://ex.moonchan.xyz/s/dc8a9d070e/3631029-165?redirect_to=image',
  'e0_e': 'https://ex.moonchan.xyz/s/7038da03f6/3631029-139?redirect_to=image',
  'e_e': 'https://ex.moonchan.xyz/s/560362909c/3631029-132?redirect_to=image',
  'e_e2': 'https://ex.moonchan.xyz/s/b46d40eba5/3631029-133?redirect_to=image',
  'e_ht2': 'https://ex.moonchan.xyz/s/3b164676f3/3631029-134?redirect_to=image',
  'e_hy': 'https://ex.moonchan.xyz/s/5be911eaee/3631029-135?redirect_to=image',
  'e_hye': 'https://ex.moonchan.xyz/s/c44cf8f45c/3631029-136?redirect_to=image',
  'e_n': 'https://ex.moonchan.xyz/s/391e0590f6/3631029-137?redirect_to=image',
  'e_o': 'https://ex.moonchan.xyz/s/7e0048637e/3631029-138?redirect_to=image',
  'm0_e': 'https://ex.moonchan.xyz/s/33229f67ea/3631029-148?redirect_to=image',
  'm_e': 'https://ex.moonchan.xyz/s/66c3d91486/3631029-140?redirect_to=image',
  'm_e2': 'https://ex.moonchan.xyz/s/c7b9e7950c/3631029-141?redirect_to=image',
  'm_e3': 'https://ex.moonchan.xyz/s/b70b915de7/3631029-142?redirect_to=image',
  'm_ht': 'https://ex.moonchan.xyz/s/1f88d31b08/3631029-143?redirect_to=image',
  'm_ht3': 'https://ex.moonchan.xyz/s/948f4123bb/3631029-144?redirect_to=image',
  'm_hy': 'https://ex.moonchan.xyz/s/53a5dcaec2/3631029-145?redirect_to=image',
  'm_n': 'https://ex.moonchan.xyz/s/5a1e551e6e/3631029-146?redirect_to=image',
  'm_o': 'https://ex.moonchan.xyz/s/67d8513fa8/3631029-147?redirect_to=image',
  'n_e': 'https://ex.moonchan.xyz/s/abf7c0f13e/3631029-149?redirect_to=image',
  'n_e2': 'https://ex.moonchan.xyz/s/b59805d336/3631029-150?redirect_to=image',
  'n_g': 'https://ex.moonchan.xyz/s/94866d0e64/3631029-151?redirect_to=image',
  'n_ht': 'https://ex.moonchan.xyz/s/1bbe71da76/3631029-152?redirect_to=image',
  'n_hy': 'https://ex.moonchan.xyz/s/97454eb004/3631029-153?redirect_to=image',
  'n_hye': 'https://ex.moonchan.xyz/s/cbb28d040b/3631029-154?redirect_to=image',
  'n_hye2': 'https://ex.moonchan.xyz/s/a8ac77e5e9/3631029-155?redirect_to=image',
  'n_k': 'https://ex.moonchan.xyz/s/c89fa48ac9/3631029-156?redirect_to=image',
  'n_n': 'https://ex.moonchan.xyz/s/97ec9819b5/3631029-157?redirect_to=image',
  'n_o': 'https://ex.moonchan.xyz/s/b71f6d9016/3631029-158?redirect_to=image',
  'n_t': 'https://ex.moonchan.xyz/s/988b90e7e5/3631029-159?redirect_to=image',
  'nk_e2': 'https://ex.moonchan.xyz/s/5515ad763e/3631029-160?redirect_to=image',
  'nk_hte2': 'https://ex.moonchan.xyz/s/028680f21a/3631029-161?redirect_to=image',
  'nk_t': 'https://ex.moonchan.xyz/s/c5f439819e/3631029-162?redirect_to=image',
};

const textureCache = new Map<string, PIXI.Texture>();

export function getTexture(key: string): PIXI.Texture {
  return textureCache.get(key) ?? PIXI.Texture.EMPTY;
}

function loadImage(key: string, url: string): Promise<{ key: string; tex: PIXI.Texture }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const tex = PIXI.Texture.from(img);
      resolve({ key, tex });
    };
    img.onerror = () => reject(new Error(`failed to load: ${url}`));
    img.src = url;
  });
}

const preloadPromise: Promise<void> = (async () => {
  const entries = Object.entries(IMAGE_MAP);
  const results = await Promise.allSettled(
    entries.map(([key, url]) => loadImage(key, url)),
  );
  for (const r of results) {
    if (r.status === 'fulfilled') {
      textureCache.set(r.value.key, r.value.tex);
    }
  }
})();

export function makeResolver(): import('../../components').AvdAssetResolver {
  return {
    loadTexture: async (key) => getTexture(key),
  };
}

export { preloadPromise };
export const preloadImages = (keys: string[]) => preloadPromise;
