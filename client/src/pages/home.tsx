import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, Download, AlertCircle, CheckCircle2, Loader2, ArrowRight, X, Image, FileType, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_FORMATS, type SupportedFormat, type FileInfo, type ConversionResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type ConversionStatus = "idle" | "uploading" | "converting" | "success" | "error";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) {
    return <Image className="w-5 h-5" />;
  }
  return <FileType className="w-5 h-5" />;
}

function getFormatFromMime(type: string): string {
  const mimeMap: Record<string, string> = {
    "image/png": "PNG",
    "image/jpeg": "JPG",
    "image/webp": "WEBP",
    "image/tiff": "TIFF",
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "application/msword": "WORD",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "WORD",
  };
  return mimeMap[type] || type.split("/").pop()?.toUpperCase() || "FILE";
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>("PNG");
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visit")
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(() => {});
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setFileInfo({
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
    });
    setStatus("idle");
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleConvert = async () => {
    if (!file) return;

    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetFormat", targetFormat);

      setStatus("converting");

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const data: ConversionResponse = await response.json();

      if (data.success) {
        setStatus("success");
        setResult(data);
      } else {
        setStatus("error");
        setResult(data);
      }
    } catch (error) {
      setStatus("error");
      setResult({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileInfo(null);
    setStatus("idle");
    setResult(null);
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      window.open(result.downloadUrl, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-6 border-b border-border">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-primary rounded-md">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">File Converter</h1>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div
              data-testid="dropzone-upload"
              className={`
                relative border-2 border-dashed rounded-md transition-all duration-200
                ${isDragging 
                  ? "border-primary bg-primary/5" 
                  : file 
                    ? "border-border bg-muted/30" 
                    : "border-muted-foreground/30 hover:border-muted-foreground/50"
                }
                ${file ? "py-6 px-6" : "py-16 px-6"}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {!file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-foreground">
                      Drag and drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    data-testid="input-file"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-md">
                    {getFileIcon(fileInfo?.type || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-medium text-foreground truncate" data-testid="text-filename">
                      {fileInfo?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm text-muted-foreground" data-testid="text-filesize">
                        {formatFileSize(fileInfo?.size || 0)}
                      </span>
                      <Badge variant="secondary" className="text-xs" data-testid="badge-format">
                        {getFormatFromMime(fileInfo?.type || "")}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    data-testid="button-remove-file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Convert to
                <span className="text-muted-foreground font-normal ml-2">
                  (all formats available)
                </span>
              </label>
              <Select
                value={targetFormat}
                onValueChange={(value) => setTargetFormat(value as SupportedFormat)}
              >
                <SelectTrigger className="w-full h-12" data-testid="select-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_FORMATS.map((format) => (
                    <SelectItem key={format} value={format} data-testid={`option-format-${format.toLowerCase()}`}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full mt-6 h-12 text-base"
              onClick={handleConvert}
              disabled={!file || status === "uploading" || status === "converting"}
              data-testid="button-convert"
            >
              {status === "uploading" || status === "converting" ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  Convert
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <div className="mt-6 min-h-[80px]">
              {status === "success" && result && (
                <div
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-md"
                  data-testid="status-success"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Conversion successful!
                      </p>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1 font-mono truncate">
                        {result.filename}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="flex-shrink-0"
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {status === "error" && result && (
                <div
                  className="p-4 bg-destructive/10 border border-destructive/20 rounded-md"
                  data-testid="status-error"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">
                        Conversion failed
                      </p>
                      <p className="text-sm text-destructive/80 mt-1">
                        {result.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === "idle" && !file && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Upload a file to get started
                </div>
              )}

              {status === "idle" && file && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Ready to convert to {targetFormat}
                </div>
              )}
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Supported formats</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUPPORTED_FORMATS.map((format) => (
                <Badge key={format} variant="outline" className="text-xs" data-testid={`badge-supported-${format.toLowerCase()}`}>
                  {format}
                </Badge>
              ))}
            </div>
          </div>

          {visitorCount !== null && (
            <div className="mt-8 text-center" data-testid="visitor-counter">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Visitors:</span>
                <span className="text-sm font-bold text-foreground" data-testid="text-visitor-count">
                  {visitorCount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
