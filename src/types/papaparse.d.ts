declare module 'papaparse' {
  export function parse(input: string | File, config?: any): any;
  export default { parse };
}
