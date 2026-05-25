declare module "pdfmake/build/pdfmake" {
  const pdfMake: {
    vfs?: Record<string, string>;
    createPdf: (doc: unknown) => {
      getBuffer: () => Promise<Buffer | Uint8Array>;
    };
  };
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfsFonts: {
    pdfMake?: { vfs: Record<string, string> };
  };
  export default vfsFonts;
}
