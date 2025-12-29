import { z } from "zod";

export const SUPPORTED_FORMATS = [
  "PNG",
  "JPG",
  "WEBP",
  "TIFF",
  "PDF",
  "TXT",
  "WORD",
] as const;

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

export const conversionRequestSchema = z.object({
  targetFormat: z.enum(SUPPORTED_FORMATS),
});

export type ConversionRequest = z.infer<typeof conversionRequestSchema>;

export interface ConversionResponse {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  error?: string;
  originalFormat?: string;
  targetFormat?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
}
