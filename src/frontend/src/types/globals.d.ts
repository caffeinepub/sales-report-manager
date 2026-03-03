// Type declarations for CDN-loaded libraries

declare namespace jspdf {
  class jsPDF {
    constructor(options?: {
      orientation?: "portrait" | "landscape" | "p" | "l";
      unit?: "pt" | "mm" | "cm" | "in";
      format?: string | number[];
    });
    text(
      text: string,
      x: number,
      y: number,
      options?: { align?: "left" | "center" | "right" },
    ): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    setPage(page: number): jsPDF;
    addPage(): jsPDF;
    save(filename: string): void;
    output(type: string): string;
    internal: {
      pageSize: { width: number; height: number };
      getNumberOfPages(): number;
    };
    autoTable(options: AutoTableOptions): void;
  }

  interface AutoTableOptions {
    head?: string[][];
    body?: (string | number)[][];
    startY?: number;
    theme?: string;
    headStyles?: Record<string, unknown>;
    bodyStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    footStyles?: Record<string, unknown>;
    didParseCell?: (data: {
      row: { index: number };
      cell: { styles: Record<string, unknown> };
    }) => void;
    margin?: { top?: number; bottom?: number; left?: number; right?: number };
    styles?: Record<string, unknown>;
    columnStyles?: Record<string, unknown>;
  }
}

declare interface Window {
  jspdf: typeof jspdf;
  XLSX: XLSXStatic;
}

interface XLSXStatic {
  utils: {
    book_new(): XLSXWorkbook;
    book_append_sheet(wb: XLSXWorkbook, ws: XLSXWorksheet, name: string): void;
    aoa_to_sheet(data: (string | number | null | undefined)[][]): XLSXWorksheet;
    json_to_sheet(data: Record<string, unknown>[]): XLSXWorksheet;
  };
  writeFile(
    wb: XLSXWorkbook,
    filename: string,
    options?: { compression?: boolean },
  ): void;
}

interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorksheet>;
}

interface XLSXWorksheet {
  [key: string]: unknown;
  "!cols"?: { wch: number }[];
  "!rows"?: { hpt: number }[];
}
