declare module 'subset-font' {
  interface SubsetOptions {
    targetFormat?: 'truetype' | 'woff' | 'woff2' | 'sfnt';
  }

  function subsetFont(
    fontBuffer: Buffer,
    text: string,
    options?: SubsetOptions
  ): Promise<Buffer>;

  export default subsetFont;
}
