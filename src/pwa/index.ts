export { isStandalone, onStandaloneChange } from './standalone';
export { detectMobile, isMobile, type MobileDetection, type MobileEvidence } from './isMobile';
export {
  InstallPrompt,
  detectInstallPlatform,
  type InstallPromptProps,
  type InstallPlatform,
} from './InstallPrompt';
export {
  PwaGate,
  isAccessGranted,
  setBypass,
  type PwaGateProps,
  type StandaloneRequirement,
} from './PwaGate';
