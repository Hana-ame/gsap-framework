// Example registry — only new VN-framework (src/vn) scenes.
import { lazy } from 'react';
import type { ComponentType } from 'react';

const componentVn = lazy(() =>
  import('./component-vn/ComponentVnDisplay').then((m) => ({ default: m.ComponentVnDisplay as ComponentType })),
);

const hazusa_HA1_21 = lazy(() =>
  import('./hscene/azusa_HA1_21').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HA2_22 = lazy(() =>
  import('./hscene/azusa_HA2_22').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HA3_23 = lazy(() =>
  import('./hscene/azusa_HA3_23').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HA4_24 = lazy(() =>
  import('./hscene/azusa_HA4_24').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HB1_27 = lazy(() =>
  import('./hscene/azusa_HB1_27').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HB2_29 = lazy(() =>
  import('./hscene/azusa_HB2_29').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HB3_30 = lazy(() =>
  import('./hscene/azusa_HB3_30').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HB4_32 = lazy(() =>
  import('./hscene/azusa_HB4_32').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HC1_35 = lazy(() =>
  import('./hscene/azusa_HC1_35').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HC2_36 = lazy(() =>
  import('./hscene/azusa_HC2_36').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HC3_38 = lazy(() =>
  import('./hscene/azusa_HC3_38').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HC4_39 = lazy(() =>
  import('./hscene/azusa_HC4_39').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HD1_42 = lazy(() =>
  import('./hscene/azusa_HD1_42').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HD2_44 = lazy(() =>
  import('./hscene/azusa_HD2_44').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HD3_45 = lazy(() =>
  import('./hscene/azusa_HD3_45').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HD4_46 = lazy(() =>
  import('./hscene/azusa_HD4_46').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HD5_48 = lazy(() =>
  import('./hscene/azusa_HD5_48').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HE1_52 = lazy(() =>
  import('./hscene/azusa_HE1_52').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HE2_53 = lazy(() =>
  import('./hscene/azusa_HE2_53').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HE3_55 = lazy(() =>
  import('./hscene/azusa_HE3_55').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HE4_56 = lazy(() =>
  import('./hscene/azusa_HE4_56').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HF1_59 = lazy(() =>
  import('./hscene/azusa_HF1_59').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HF2_60 = lazy(() =>
  import('./hscene/azusa_HF2_60').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HG1_63 = lazy(() =>
  import('./hscene/azusa_HG1_63').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HG2_64 = lazy(() =>
  import('./hscene/azusa_HG2_64').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HH1_69 = lazy(() =>
  import('./hscene/azusa_HH1_69').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HH2_70 = lazy(() =>
  import('./hscene/azusa_HH2_70').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HH3_71 = lazy(() =>
  import('./hscene/azusa_HH3_71').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HH4_72 = lazy(() =>
  import('./hscene/azusa_HH4_72').then((m) => ({ default: m.default as ComponentType })),
);
const hazusa_HH5_74 = lazy(() =>
  import('./hscene/azusa_HH5_74').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HA1_25 = lazy(() =>
  import('./hscene/iru_HA1_25').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HA2_26 = lazy(() =>
  import('./hscene/iru_HA2_26').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HA3_27 = lazy(() =>
  import('./hscene/iru_HA3_27').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HB1_34 = lazy(() =>
  import('./hscene/iru_HB1_34').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HB2_35 = lazy(() =>
  import('./hscene/iru_HB2_35').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HB_33 = lazy(() =>
  import('./hscene/iru_HB_33').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HC1_42 = lazy(() =>
  import('./hscene/iru_HC1_42').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HC1_46 = lazy(() =>
  import('./hscene/iru_HC1_46').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HC2_47 = lazy(() =>
  import('./hscene/iru_HC2_47').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HC3_44 = lazy(() =>
  import('./hscene/iru_HC3_44').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HC3_48 = lazy(() =>
  import('./hscene/iru_HC3_48').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HD1_55 = lazy(() =>
  import('./hscene/iru_HD1_55').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HD2_56 = lazy(() =>
  import('./hscene/iru_HD2_56').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HD3_57 = lazy(() =>
  import('./hscene/iru_HD3_57').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HE1_60 = lazy(() =>
  import('./hscene/iru_HE1_60').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HE2_61 = lazy(() =>
  import('./hscene/iru_HE2_61').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HF1_63 = lazy(() =>
  import('./hscene/iru_HF1_63').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_HG1_65 = lazy(() =>
  import('./hscene/iru_HG1_65').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_T21_39 = lazy(() =>
  import('./hscene/iru_T21_39').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_T22_40 = lazy(() =>
  import('./hscene/iru_T22_40').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_T22_41 = lazy(() =>
  import('./hscene/iru_T22_41').then((m) => ({ default: m.default as ComponentType })),
);
const hiru_T3_54 = lazy(() =>
  import('./hscene/iru_T3_54').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA11_13 = lazy(() =>
  import('./hscene/isekai_HA11_13').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA21_14 = lazy(() =>
  import('./hscene/isekai_HA21_14').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA31_16 = lazy(() =>
  import('./hscene/isekai_HA31_16').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA41_19 = lazy(() =>
  import('./hscene/isekai_HA41_19').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA43_21 = lazy(() =>
  import('./hscene/isekai_HA43_21').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HA44_22 = lazy(() =>
  import('./hscene/isekai_HA44_22').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB11_25 = lazy(() =>
  import('./hscene/isekai_HB11_25').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB12_26 = lazy(() =>
  import('./hscene/isekai_HB12_26').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB21_27 = lazy(() =>
  import('./hscene/isekai_HB21_27').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB31_28 = lazy(() =>
  import('./hscene/isekai_HB31_28').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB32_29 = lazy(() =>
  import('./hscene/isekai_HB32_29').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HB41_30 = lazy(() =>
  import('./hscene/isekai_HB41_30').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC11_34 = lazy(() =>
  import('./hscene/isekai_HC11_34').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC12_35 = lazy(() =>
  import('./hscene/isekai_HC12_35').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC21_36 = lazy(() =>
  import('./hscene/isekai_HC21_36').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC31_37 = lazy(() =>
  import('./hscene/isekai_HC31_37').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC32_39 = lazy(() =>
  import('./hscene/isekai_HC32_39').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HC41_40 = lazy(() =>
  import('./hscene/isekai_HC41_40').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD11_44 = lazy(() =>
  import('./hscene/isekai_HD11_44').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD12_45 = lazy(() =>
  import('./hscene/isekai_HD12_45').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD21_48 = lazy(() =>
  import('./hscene/isekai_HD21_48').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD31_52 = lazy(() =>
  import('./hscene/isekai_HD31_52').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD32_53 = lazy(() =>
  import('./hscene/isekai_HD32_53').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD33_54 = lazy(() =>
  import('./hscene/isekai_HD33_54').then((m) => ({ default: m.default as ComponentType })),
);
const hisekai_HD34_55 = lazy(() =>
  import('./hscene/isekai_HD34_55').then((m) => ({ default: m.default as ComponentType })),
);

export const EXAMPLES = [
  'component-vn', 'hscene-azusa_HA1_21', 'hscene-azusa_HA2_22', 'hscene-azusa_HA3_23', 'hscene-azusa_HA4_24', 'hscene-azusa_HB1_27', 'hscene-azusa_HB2_29', 'hscene-azusa_HB3_30', 'hscene-azusa_HB4_32', 'hscene-azusa_HC1_35', 'hscene-azusa_HC2_36', 'hscene-azusa_HC3_38', 'hscene-azusa_HC4_39', 'hscene-azusa_HD1_42', 'hscene-azusa_HD2_44', 'hscene-azusa_HD3_45', 'hscene-azusa_HD4_46', 'hscene-azusa_HD5_48', 'hscene-azusa_HE1_52', 'hscene-azusa_HE2_53', 'hscene-azusa_HE3_55', 'hscene-azusa_HE4_56', 'hscene-azusa_HF1_59', 'hscene-azusa_HF2_60', 'hscene-azusa_HG1_63', 'hscene-azusa_HG2_64', 'hscene-azusa_HH1_69', 'hscene-azusa_HH2_70', 'hscene-azusa_HH3_71', 'hscene-azusa_HH4_72', 'hscene-azusa_HH5_74', 'hscene-iru_HA1_25', 'hscene-iru_HA2_26', 'hscene-iru_HA3_27', 'hscene-iru_HB1_34', 'hscene-iru_HB2_35', 'hscene-iru_HB_33', 'hscene-iru_HC1_42', 'hscene-iru_HC1_46', 'hscene-iru_HC2_47', 'hscene-iru_HC3_44', 'hscene-iru_HC3_48', 'hscene-iru_HD1_55', 'hscene-iru_HD2_56', 'hscene-iru_HD3_57', 'hscene-iru_HE1_60', 'hscene-iru_HE2_61', 'hscene-iru_HF1_63', 'hscene-iru_HG1_65', 'hscene-iru_T21_39', 'hscene-iru_T22_40', 'hscene-iru_T22_41', 'hscene-iru_T3_54', 'hscene-isekai_HA11_13', 'hscene-isekai_HA21_14', 'hscene-isekai_HA31_16', 'hscene-isekai_HA41_19', 'hscene-isekai_HA43_21', 'hscene-isekai_HA44_22', 'hscene-isekai_HB11_25', 'hscene-isekai_HB12_26', 'hscene-isekai_HB21_27', 'hscene-isekai_HB31_28', 'hscene-isekai_HB32_29', 'hscene-isekai_HB41_30', 'hscene-isekai_HC11_34', 'hscene-isekai_HC12_35', 'hscene-isekai_HC21_36', 'hscene-isekai_HC31_37', 'hscene-isekai_HC32_39', 'hscene-isekai_HC41_40', 'hscene-isekai_HD11_44', 'hscene-isekai_HD12_45', 'hscene-isekai_HD21_48', 'hscene-isekai_HD31_52', 'hscene-isekai_HD32_53', 'hscene-isekai_HD33_54', 'hscene-isekai_HD34_55'
] as const;

export type Example = (typeof EXAMPLES)[number];
export const DEFAULT_EXAMPLE: Example = 'component-vn';

export const isExample = (s: string): s is Example =>
  (EXAMPLES as readonly string[]).includes(s);

export const exampleMap: Record<Example, ComponentType> = {
  'component-vn': componentVn,
  'hscene-azusa_HA1_21': hazusa_HA1_21,
  'hscene-azusa_HA2_22': hazusa_HA2_22,
  'hscene-azusa_HA3_23': hazusa_HA3_23,
  'hscene-azusa_HA4_24': hazusa_HA4_24,
  'hscene-azusa_HB1_27': hazusa_HB1_27,
  'hscene-azusa_HB2_29': hazusa_HB2_29,
  'hscene-azusa_HB3_30': hazusa_HB3_30,
  'hscene-azusa_HB4_32': hazusa_HB4_32,
  'hscene-azusa_HC1_35': hazusa_HC1_35,
  'hscene-azusa_HC2_36': hazusa_HC2_36,
  'hscene-azusa_HC3_38': hazusa_HC3_38,
  'hscene-azusa_HC4_39': hazusa_HC4_39,
  'hscene-azusa_HD1_42': hazusa_HD1_42,
  'hscene-azusa_HD2_44': hazusa_HD2_44,
  'hscene-azusa_HD3_45': hazusa_HD3_45,
  'hscene-azusa_HD4_46': hazusa_HD4_46,
  'hscene-azusa_HD5_48': hazusa_HD5_48,
  'hscene-azusa_HE1_52': hazusa_HE1_52,
  'hscene-azusa_HE2_53': hazusa_HE2_53,
  'hscene-azusa_HE3_55': hazusa_HE3_55,
  'hscene-azusa_HE4_56': hazusa_HE4_56,
  'hscene-azusa_HF1_59': hazusa_HF1_59,
  'hscene-azusa_HF2_60': hazusa_HF2_60,
  'hscene-azusa_HG1_63': hazusa_HG1_63,
  'hscene-azusa_HG2_64': hazusa_HG2_64,
  'hscene-azusa_HH1_69': hazusa_HH1_69,
  'hscene-azusa_HH2_70': hazusa_HH2_70,
  'hscene-azusa_HH3_71': hazusa_HH3_71,
  'hscene-azusa_HH4_72': hazusa_HH4_72,
  'hscene-azusa_HH5_74': hazusa_HH5_74,
  'hscene-iru_HA1_25': hiru_HA1_25,
  'hscene-iru_HA2_26': hiru_HA2_26,
  'hscene-iru_HA3_27': hiru_HA3_27,
  'hscene-iru_HB1_34': hiru_HB1_34,
  'hscene-iru_HB2_35': hiru_HB2_35,
  'hscene-iru_HB_33': hiru_HB_33,
  'hscene-iru_HC1_42': hiru_HC1_42,
  'hscene-iru_HC1_46': hiru_HC1_46,
  'hscene-iru_HC2_47': hiru_HC2_47,
  'hscene-iru_HC3_44': hiru_HC3_44,
  'hscene-iru_HC3_48': hiru_HC3_48,
  'hscene-iru_HD1_55': hiru_HD1_55,
  'hscene-iru_HD2_56': hiru_HD2_56,
  'hscene-iru_HD3_57': hiru_HD3_57,
  'hscene-iru_HE1_60': hiru_HE1_60,
  'hscene-iru_HE2_61': hiru_HE2_61,
  'hscene-iru_HF1_63': hiru_HF1_63,
  'hscene-iru_HG1_65': hiru_HG1_65,
  'hscene-iru_T21_39': hiru_T21_39,
  'hscene-iru_T22_40': hiru_T22_40,
  'hscene-iru_T22_41': hiru_T22_41,
  'hscene-iru_T3_54': hiru_T3_54,
  'hscene-isekai_HA11_13': hisekai_HA11_13,
  'hscene-isekai_HA21_14': hisekai_HA21_14,
  'hscene-isekai_HA31_16': hisekai_HA31_16,
  'hscene-isekai_HA41_19': hisekai_HA41_19,
  'hscene-isekai_HA43_21': hisekai_HA43_21,
  'hscene-isekai_HA44_22': hisekai_HA44_22,
  'hscene-isekai_HB11_25': hisekai_HB11_25,
  'hscene-isekai_HB12_26': hisekai_HB12_26,
  'hscene-isekai_HB21_27': hisekai_HB21_27,
  'hscene-isekai_HB31_28': hisekai_HB31_28,
  'hscene-isekai_HB32_29': hisekai_HB32_29,
  'hscene-isekai_HB41_30': hisekai_HB41_30,
  'hscene-isekai_HC11_34': hisekai_HC11_34,
  'hscene-isekai_HC12_35': hisekai_HC12_35,
  'hscene-isekai_HC21_36': hisekai_HC21_36,
  'hscene-isekai_HC31_37': hisekai_HC31_37,
  'hscene-isekai_HC32_39': hisekai_HC32_39,
  'hscene-isekai_HC41_40': hisekai_HC41_40,
  'hscene-isekai_HD11_44': hisekai_HD11_44,
  'hscene-isekai_HD12_45': hisekai_HD12_45,
  'hscene-isekai_HD21_48': hisekai_HD21_48,
  'hscene-isekai_HD31_52': hisekai_HD31_52,
  'hscene-isekai_HD32_53': hisekai_HD32_53,
  'hscene-isekai_HD33_54': hisekai_HD33_54,
  'hscene-isekai_HD34_55': hisekai_HD34_55,
};
