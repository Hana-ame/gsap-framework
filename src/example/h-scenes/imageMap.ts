import * as PIXI from "pixi.js";

export const IMAGE_MAP: Record<string, string> = {
  "HA1-1": "https://p.sda1.dev/33/e41c089007b1976edcd0661f8db1edee/HA1-1.png",
  "HA1-2": "https://p.sda1.dev/33/882b9f5cbe8505d6c883e89a26e8fbb3/HA1-2.png",
  "HA1-3": "https://p.sda1.dev/33/f9f19eb7a34224c001c4e243539a539f/HA1-3.png",
  "HA1-3^": "https://p.sda1.dev/33/dcc7f48433ddfc93576899260bea3fa6/HA1-3^.png",
  "HA1-4": "https://p.sda1.dev/33/70bfc53531a75916f062fdbee8999b28/HA1-4.png",
  "HA1-5": "https://p.sda1.dev/33/fe7f054863ffe1f4652d006983137f96/HA1-5.png",
  "HA2-3": "https://p.sda1.dev/33/a3d3f31e0bb08325d708fd7ad1f17cb0/HA2-3.png",
  "HA3-1": "https://p.sda1.dev/33/701053f85b20c5b22d710ef7661b9246/HA3-1.png",
  "HA3-2": "https://p.sda1.dev/33/2b4915ccc5e7cde0f60a5da6bbdf2791/HA3-2.png",
  "HA3-3": "https://p.sda1.dev/33/879235089e5dfa9899f058dcae4aab77/HA3-3.png",
  "HA3-4": "https://p.sda1.dev/33/b910edfa67820aedb4c071ef9cf4bf97/HA3-4.png",
  "HB1-1": "https://p.sda1.dev/33/4348e9a87761c929b412cc82976b2f3a/HB1-1.png",
  "HB1-2": "https://p.sda1.dev/33/f8d0bddc233199665babf03cd0a51246/HB1-2.png",
  "HB1-3": "https://p.sda1.dev/33/57793b9b369f783686836e7369e007fc/HB1-3.png",
  "HB1-4": "https://p.sda1.dev/33/82c928af03eca4cc738262d3aea7ff4f/HB1-4.png",
  "HB1-5": "https://p.sda1.dev/33/d11608579518d4a422bbc3c74e223e38/HB1-5.png",
  "HB1-6": "https://p.sda1.dev/33/d8d137fb910d017093031d438a2ed0c7/HB1-6.png",
  "HB1-7": "https://p.sda1.dev/33/ed3501db434a69e8c9a4592b8ff5eb4e/HB1-7.png",
  "HB1-8": "https://p.sda1.dev/33/2b68f34f50b0ccdad3fceea178482879/HB1-8.png",
  "HB1-9": "https://p.sda1.dev/33/fae74eddcf4eaa6ad52c2ede19e1f626/HB1-9.png",
  "HB2-1": "https://p.sda1.dev/33/0633db29589395c25ea51e8e02dbeac9/HB2-1.png",
  "HB2-2": "https://p.sda1.dev/33/462c66a08139d78f541d9f8630b3c4c5/HB2-2.png",
  "HB2-3": "https://p.sda1.dev/33/c2dd0e7263a98136ba7afbf9049956ac/HB2-3.png",
  "HB2-4": "https://p.sda1.dev/33/d13842015610b7354f8c96716b39940d/HB2-4.png",
  "HC1-1": "https://p.sda1.dev/33/ae5ff8f4288dc1a236211f5147818377/HC1-1.png",
  "HC1-2": "https://p.sda1.dev/33/4ee7b056688a4984ddb98b8ffbc0083f/HC1-2.png",
  "HC1-3": "https://p.sda1.dev/33/9e4a6c93d472066c54def9bcfd827c4a/HC1-3.png",
  "HC1-4": "https://p.sda1.dev/33/f175594aadece026e679337928676d19/HC1-4.png",
  "HC1-5": "https://p.sda1.dev/33/19f177c38219e31fb9b51317ff2b3b8e/HC1-5.png",
  "HC1-6": "https://p.sda1.dev/33/ebd6b97e38604a3ae9a3c506dbb799b3/HC1-6.png",
  "HC1-7": "https://p.sda1.dev/33/296bab97094f13d35c55634f27a2fbb8/HC1-7.png",
  "HC1-8": "https://p.sda1.dev/33/cfcb3cb56d92b718405f911bce05b4ce/HC1-8.png",
  "HC2-1": "https://p.sda1.dev/33/f272323a021cb77c72295fd87fbcbac0/HC2-1.png",
  "HC2-2": "https://p.sda1.dev/33/0da13126ec8a58c7b844f99135067792/HC2-2.png",
  "HC2-3": "https://p.sda1.dev/33/d3d52844bf4f7f22cda6e65ca6c29a80/HC2-3.png",
  "HC2-4": "https://p.sda1.dev/33/30611ce53dadc116a393cca853814119/HC2-4.png",
  "HC2-5": "https://p.sda1.dev/33/2dfaf30062d99f224d7b7ec193b96508/HC2-5.png",
  "HC2-6": "https://p.sda1.dev/33/c2e4a2f6cb55121903176f66941717b2/HC2-6.png",
  "HC2-7": "https://p.sda1.dev/33/c5bba5606cd639ca2ea3aa16d7d8ef29/HC2-7.png",
  "HC2-8": "https://p.sda1.dev/33/7992211147207f652557aa9673c9e12f/HC2-8.png",
  "HC3-1": "https://p.sda1.dev/33/f1acc048e24293deb5c1e6bc0c7f65af/HC3-1.png",
  "HC3-2": "https://p.sda1.dev/33/146f8fd019acd72763bf4cfadf9317c4/HC3-2.png",
  "HC3-2^": "https://p.sda1.dev/33/271dca52f7f1e8f9482d6c438e8d7259/HC3-2^.png",
  "HC3-3": "https://p.sda1.dev/33/4c00c27b83d15bed781b9915c1474e5e/HC3-3.png",
  "HC3-4": "https://p.sda1.dev/33/af00e176d82532e13029cc3f40613e82/HC3-4.png",
  "HC3-5": "https://p.sda1.dev/33/0015cc8abe4751b2b685fab39e0d6b3c/HC3-5.png",
  "HC3-6": "https://p.sda1.dev/33/096c8a2f547fda68872d5299edd1488e/HC3-6.png",
  "HC3-7": "https://p.sda1.dev/33/a87e59b3b060cb8cc074f2a2ffc0f726/HC3-7.png",
  "HC3-8": "https://p.sda1.dev/33/08b276cd1d8009e36a90755c26e6b725/HC3-8.png",
  "HC3-9": "https://p.sda1.dev/33/803a0df35cd9c79135eb52e7ad1e1faa/HC3-9.png",
  "HD1-1": "https://p.sda1.dev/33/3d4bed86622d5cb47b440763c92febf0/HD1-1.png",
  "HD1-2": "https://p.sda1.dev/33/2f9fb01fa5b46618aec3cd3b636a746d/HD1-2.png",
  "HD1-3": "https://p.sda1.dev/33/b685c4655ff2dd212128243a9280c67c/HD1-3.png",
  "HD1-4": "https://p.sda1.dev/33/0630603401f88c3846e8a9f3c3cd5f78/HD1-4.png",
  "HD1-5": "https://p.sda1.dev/33/d5ee7037cca9d6fac27af03f76e9811b/HD1-5.png",
  "HD1-6": "https://p.sda1.dev/33/b32c5848593d50b794b47a10d16acd80/HD1-6.png",
  "HD1-7": "https://p.sda1.dev/33/7c222e636361dafe61ac1ff561ba8034/HD1-7.png",
  "HD1-8": "https://p.sda1.dev/33/f61cd89f97c4d2f43484acce3979af8e/HD1-8.png",
  "HD1-9": "https://p.sda1.dev/33/abd940c7bf5f67f89ae1a600f369ab57/HD1-9.png",
  "HD2-1": "https://p.sda1.dev/33/01200cf39c585376c83eb8ba0c62b48b/HD2-1.png",
  "HD2-2": "https://p.sda1.dev/33/9ca5b2909bde349e6a27388d0212d4a3/HD2-2.png",
  "HD2-3": "https://p.sda1.dev/33/434c4669a0ccebf227e32a9391d846b4/HD2-3.png",
  "HD2-4": "https://p.sda1.dev/33/2b45de9fe9180dad6f11ae6e66ca4fb7/HD2-4.png",
  "HD2-5": "https://p.sda1.dev/33/30127047a557a99e6a8f8f957fc09da9/HD2-5.png",
  "HD2-6": "https://p.sda1.dev/33/e2392de810a43a0599894e00e858a67b/HD2-6.png",
  "HD2-7": "https://p.sda1.dev/33/f5e30005aacd6e8aefa0521293fd6c0a/HD2-7.png",
  "HD3-1": "https://p.sda1.dev/33/96090ca06862acda57b5425399122a6f/HD3-1.png",
  "HD3-2": "https://p.sda1.dev/33/ef0eac9983ed81c8b176790a2fa5a738/HD3-2.png",
  "HD3-3": "https://p.sda1.dev/33/deb82931fbf2edaaae3d00a498e03f4b/HD3-3.png",
  "HD3-4": "https://p.sda1.dev/33/17e9d7ed5896be6e768309ccc357e0a6/HD3-4.png",
  "HD3-5": "https://p.sda1.dev/33/b305121d38d31317ecad1e6e45cf2ffb/HD3-5.png",
  "HD3-6": "https://p.sda1.dev/33/dca3568cd599781129eeaefd37f20bfc/HD3-6.png",
  "HE1-1": "https://p.sda1.dev/33/281c292c7630c15183ffefec2717d45f/HE1-1.png",
  "HE1-10": "https://p.sda1.dev/33/17c34f45f5f8caeadaefba6cc318dc26/HE1-10.png",
  "HE1-11": "https://p.sda1.dev/33/51cc5015771a3eb7fdd5d9752bf5a8dc/HE1-11.png",
  "HE1-13": "https://p.sda1.dev/33/6db0673e721da5dae39e0aed3b1325de/HE1-13.png",
  "HE1-14": "https://p.sda1.dev/33/918e7a212918b1e6998804b24632fbeb/HE1-14.png",
  "HE1-2": "https://p.sda1.dev/33/fa8620f6ec356b1f5de6afed13306135/HE1-2.png",
  "HE1-3": "https://p.sda1.dev/33/c7974d5e17ed6ed03b873e119c8c681a/HE1-3.png",
  "HE1-4": "https://p.sda1.dev/33/11bf09323d9b1a3427e4acb76a9f7906/HE1-4.png",
  "HE1-5": "https://p.sda1.dev/33/7c6708243e88952be5ae1e16edb1933e/HE1-5.png",
  "HE1-5^": "https://p.sda1.dev/33/bd82db2393113900a5ea0b5c8890dbd6/HE1-5^.png",
  "HE1-6": "https://p.sda1.dev/33/430860f6bf894bfeecae68e972b8e1a5/HE1-6.png",
  "HE1-7": "https://p.sda1.dev/33/a1b15712ba0e3c29e12a03f231a6a1a8/HE1-7.png",
  "HE1-8": "https://p.sda1.dev/33/a4712d4def635d98f90c7050276101b6/HE1-8.png",
  "HE1-9": "https://p.sda1.dev/33/31d61ef28774abdaed5bb4d0aa9a9698/HE1-9.png",
  "HE2-1": "https://p.sda1.dev/33/465e2d54998bc23736f62053ef87096a/HE2-1.png",
  "HE2-2": "https://p.sda1.dev/33/2c35cb159aa2e566aebc23cca220f432/HE2-2.png",
  "HE2-3": "https://p.sda1.dev/33/483c13bebcf97a733ca1621ca3c9bbd8/HE2-3.png",
  "HE2-4": "https://p.sda1.dev/33/43049108aa8431db0ee43874ec7295c3/HE2-4.png",
  "HE2-5": "https://p.sda1.dev/33/fbd65ea9c43d00961acac48709cdbd18/HE2-5.png",
  "HE2-6": "https://p.sda1.dev/33/c4543d322b18cdc842a63f502fa28387/HE2-6.png",
  "HF1-1": "https://p.sda1.dev/33/7272d8d43257a1b88c46891781dde19d/HF1-1.png",
  "HF1-2": "https://p.sda1.dev/33/cb1ddde3af8948176ac9bf7e7f721c36/HF1-2.png",
  "HF1-3": "https://p.sda1.dev/33/9de7788f0c072a377d0a11b63b8fae96/HF1-3.png",
  "HF1-4": "https://p.sda1.dev/33/73b672f04b8707b5f413d9363ef7405c/HF1-4.png",
  "HF1-5": "https://p.sda1.dev/33/51aa41571e2f2928892305026af3b63f/HF1-5.png",
  "HF1-6": "https://p.sda1.dev/33/908d9e17e63ba977f167cc546180a3a7/HF1-6.png",
  "HF1-7": "https://p.sda1.dev/33/8d7097b276730c7bd513ee607b343885/HF1-7.png",
  "HG1-1": "https://p.sda1.dev/33/a3a4dc97a81feeeec8b239178a87dbf2/HG1-1.png",
  "HG1-2": "https://p.sda1.dev/33/ee44ea677fe6d953468061d5bb0dda77/HG1-2.png",
  "HG1-2^": "https://p.sda1.dev/33/95f97fb6d24742db60e2160090da543a/HG1-2^.png",
  "HG1-3": "https://p.sda1.dev/33/67745521ef63aed00a4c49b1a293f009/HG1-3.png",
  "HG1-4": "https://p.sda1.dev/33/52fb8f19fe81af860f601a040a3ca13d/HG1-4.png",
  "HG1-5": "https://p.sda1.dev/33/80e489f66fcf9c72b1555ba66efa7094/HG1-5.png",
  "T1-1": "https://p.sda1.dev/33/f6f8007fa6ffa531eef4c3e7e431b5f3/T1-1.png",
  "T1-2": "https://p.sda1.dev/33/34a3ae5d3e9febde07ded37727d8fec5/T1-2.png",
  "T1-3": "https://p.sda1.dev/33/b9d8628fcebdaaf37a8b8231b9f96c6f/T1-3.png",
  "T21-0": "https://p.sda1.dev/33/9a5c5f036601bb7806d658d1e7066cce/T21-0.png",
  "T21-1": "https://p.sda1.dev/33/2ee056de6da73af54fba30bb2d2d9d84/T21-1.png",
  "T21-2": "https://p.sda1.dev/33/4e30210d8d5dcc465a0ed205a3a40b4e/T21-2.png",
  "T21-3": "https://p.sda1.dev/33/9e2cffef329718b759a87b36e4f68bb7/T21-3.png",
  "T21-4": "https://p.sda1.dev/33/7c5348ae3a9ac1d6334699266ae47295/T21-4.png",
  "T22-0": "https://p.sda1.dev/33/067ab254f22cb471f1b73b55dff462ef/T22-0.png",
  "T22-0^": "https://p.sda1.dev/33/33958aab4b125885d524194ff1618800/T22-0^.png",
  "T22-1": "https://p.sda1.dev/33/8f26fd8911cb35a003c3a14366f32d31/T22-1.png",
  "T22-1^": "https://p.sda1.dev/33/9b13dc6fdec0b2df9a2eb394968a0c76/T22-1^.png",
  "T22-2": "https://p.sda1.dev/33/07c61b077860669000289a6c569f4acc/T22-2.png",
  "T22-2^": "https://p.sda1.dev/33/67550c09b49548accd5382f826ce07b5/T22-2^.png",
  "T22-3": "https://p.sda1.dev/33/4fa130b4629f40c99b77331872b2e2d9/T22-3.png",
  "T22-4": "https://p.sda1.dev/33/22ab997b2ee58a3912cc9824633fce0c/T22-4.png",
  "T3-1": "https://p.sda1.dev/33/3d8c9091cbe1fd9d00f8a76257dbb44c/T3-1.png",
  "T3-2": "https://p.sda1.dev/33/6df8979957cdbf72a84f4c44908223be/T3-2.png",
  "T3-3": "https://p.sda1.dev/33/a75bb9b0a96a76e324dfa2b9ae2d5377/T3-3.png",
  "T3-4": "https://p.sda1.dev/33/0fe2fa555fed94374febe6e378d0f3f3/T3-4.png",
  "T3-5": "https://p.sda1.dev/33/91c41c95ed894cbdbb5b3519249e9f36/T3-5.png",
  "e0_e": "https://p.sda1.dev/33/66b7487e27209dc3906f8bb5f9356761/e0_e.png",
  "e_e": "https://p.sda1.dev/33/9c82ec910a062c7d62eb7322abaacdf2/e_e.png",
  "e_e2": "https://p.sda1.dev/33/8a0d5866dfb0ab3c7c60e570cb913e23/e_e2.png",
  "e_ht2": "https://p.sda1.dev/33/17f0cf40baa40dc5ea6bbdd14e9493ba/e_ht2.png",
  "e_hy": "https://p.sda1.dev/33/17893a05639d6fbae6535674b30912e5/e_hy.png",
  "e_hye": "https://p.sda1.dev/33/f6e416c4f5bccff0710c1e776d248228/e_hye.png",
  "e_n": "https://p.sda1.dev/33/dd3e49489eed427097fcc2f8aaa3127b/e_n.png",
  "e_o": "https://p.sda1.dev/33/793f1f4344eeb82b32d961738c9b802e/e_o.png",
  "m0_e": "https://p.sda1.dev/33/66eaab887dfc1f2f3349d8170bfef82d/m0_e.png",
  "m_e": "https://p.sda1.dev/33/c875ec1d48d9c84f93d51d1355940496/m_e.png",
  "m_e2": "https://p.sda1.dev/33/d36c093d2eacf3388f2bffb5b4bf2a8d/m_e2.png",
  "m_e3": "https://p.sda1.dev/33/6c804a0f303a89895c0e2b8a2a760cdf/m_e3.png",
  "m_ht": "https://p.sda1.dev/33/94857bfa95ae36cc9742585d41098901/m_ht.png",
  "m_ht3": "https://p.sda1.dev/33/abb8e3d7d4eee1bfa7cc99b9975d113b/m_ht3.png",
  "m_hy": "https://p.sda1.dev/33/13563b41c8d6eda20d12e98dadf4f98d/m_hy.png",
  "m_n": "https://p.sda1.dev/33/d1c2dc00379f7382a25c25f4b46507f5/m_n.png",
  "m_o": "https://p.sda1.dev/33/8e7c8bbd35d6f25865d741fd62ed8802/m_o.png",
  "n_e": "https://p.sda1.dev/33/1d122d96138606bcbcec045062dfbd44/n_e.png",
  "n_e2": "https://p.sda1.dev/33/30a9e69e0e9b253f86d211e0497f3dcb/n_e2.png",
  "n_g": "https://p.sda1.dev/33/d207d8af9a02a268e57b96b2e1a0d6fb/n_g.png",
  "n_ht": "https://p.sda1.dev/33/9704b055c84a79d41e61d9727f68fb23/n_ht.png",
  "n_hy": "https://p.sda1.dev/33/f82ebefdf1bac0456d5f268aca6c2d92/n_hy.png",
  "n_hye": "https://p.sda1.dev/33/101ae9595e6688b83d4fa03b43d46160/n_hye.png",
  "n_hye2": "https://p.sda1.dev/33/6990a42c9f9f099c586d8081d1061950/n_hye2.png",
  "n_k": "https://p.sda1.dev/33/8cdfa8517cb170116971b7c9fa26736f/n_k.png",
  "n_n": "https://p.sda1.dev/33/6ae00370a4484f7f672c2045e0e2cad2/n_n.png",
  "n_o": "https://p.sda1.dev/33/69b370f5e403531070058728ac7b3e7a/n_o.png",
  "n_t": "https://p.sda1.dev/33/cc5afe0e431f6389413d21a5f94ea5b0/n_t.png",
  "nk_e2": "https://p.sda1.dev/33/5592f5fba02a3d02889d1e1fc19f67cc/nk_e2.png",
  "nk_hte2": "https://p.sda1.dev/33/14c9176326882a294c328d5ce0c5b3ce/nk_hte2.png",
  "nk_t": "https://p.sda1.dev/33/41072aab450a3ec5b28067c1c00c4588/nk_t.png",
  "z_e": "https://p.sda1.dev/33/ac0c348bbc29ae378e7159ea9c4a6871/z_e.png",
  "z_e2": "https://p.sda1.dev/33/490278fa423dee054ee28f4ea997bb95/z_e2.png",
  "z_ht": "https://p.sda1.dev/33/0f6d97a3d5769029dca13602ab39e1ec/z_ht.png",
};

const textureCache = new Map<string, PIXI.Texture>();

export function getTexture(key: string): PIXI.Texture {
  return textureCache.get(key) ?? PIXI.Texture.EMPTY;
}

function loadImage(key: string, url: string): Promise<{ key: string; tex: PIXI.Texture }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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
    if (r.status === "fulfilled") {
      textureCache.set(r.value.key, r.value.tex);
    }
  }
})();

export function makeResolver(): import("../../components").AvdAssetResolver {
  return {
    loadTexture: async (key) => getTexture(key),
  };
}

export { preloadPromise };
export const preloadImages = (keys: string[]) => preloadPromise;

