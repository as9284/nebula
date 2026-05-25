declare module "pdfmake/build/pdfmake" {
  const pdfMake: {
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    setFonts: (fonts: Record<string, Record<string, string>>) => void;
    createPdf: (doc: unknown) => {
      getBuffer: (callback: (buffer: Buffer, error?: Error) => void) => void;
    };
  };
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfsFonts: Record<string, string>;
  export default vfsFonts;
}
