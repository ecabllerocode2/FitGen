declare module 'virtual:pwa-register' {
  export function registerSW(opts?: any): ((reload?: boolean) => Promise<void>) | undefined;
  export default registerSW;
}
