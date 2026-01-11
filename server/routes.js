"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const http_1 = require("http");
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf2pic_1 = require("pdf2pic");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const pdf_lib_1 = require("pdf-lib");
const docx_1 = require("docx");
const mammoth_1 = __importDefault(require("mammoth"));
const cloudconvert_1 = __importDefault(require("cloudconvert"));
const schema_1 = require("@shared/schema");
const cloudConvertApiKey = process.env.CLOUDCONVERT_API_KEY;
const cloudConvert = cloudConvertApiKey ? new cloudconvert_1.default(cloudConvertApiKey) : null;
const uploadsDir = path_1.default.join(process.cwd(), "uploads");
const convertedDir = path_1.default.join(process.cwd(), "converted");
const visitorCountFile = path_1.default.join(process.cwd(), "visitor_count.json");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs_1.default.existsSync(convertedDir)) {
    fs_1.default.mkdirSync(convertedDir, { recursive: true });
}
function getVisitorCount() {
    try {
        if (fs_1.default.existsSync(visitorCountFile)) {
            const data = JSON.parse(fs_1.default.readFileSync(visitorCountFile, "utf-8"));
            return data.count || 0;
        }
    }
    catch (e) {
        console.error("Error reading visitor count:", e);
    }
    return 0;
}
function incrementVisitorCount() {
    const count = getVisitorCount() + 1;
    fs_1.default.writeFileSync(visitorCountFile, JSON.stringify({ count }), "utf-8");
    return count;
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});
const IMAGE_FORMATS = ["PNG", "JPG", "WEBP", "TIFF"];
function getExtensionFromFormat(format) {
    const extensions = {
        PNG: "png",
        JPG: "jpg",
        WEBP: "webp",
        TIFF: "tiff",
        PDF: "pdf",
        TXT: "txt",
        WORD: "docx",
    };
    return extensions[format];
}
function getFormatFromMime(mimeType) {
    const mimeMap = {
        "image/png": "PNG",
        "image/jpeg": "JPG",
        "image/webp": "WEBP",
        "image/tiff": "TIFF",
        "application/pdf": "PDF",
        "text/plain": "TXT",
        "application/msword": "WORD",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "WORD",
    };
    return mimeMap[mimeType] || mimeType.split("/").pop()?.toUpperCase() || "UNKNOWN";
}
function isWordMime(mimeType) {
    return (mimeType === "application/msword" ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}
function isImageMime(mimeType) {
    return mimeType.startsWith("image/");
}
function isPdfMime(mimeType) {
    return mimeType === "application/pdf";
}
function isTextMime(mimeType) {
    return mimeType === "text/plain";
}
async function convertImage(inputPath, outputPath, targetFormat) {
    let sharpInstance = (0, sharp_1.default)(inputPath);
    switch (targetFormat) {
        case "PNG":
            sharpInstance = sharpInstance.png();
            break;
        case "JPG":
            sharpInstance = sharpInstance.jpeg({ quality: 90 });
            break;
        case "WEBP":
            sharpInstance = sharpInstance.webp({ quality: 90 });
            break;
        case "TIFF":
            sharpInstance = sharpInstance.tiff();
            break;
        default:
            throw new Error(`Unsupported image format: ${targetFormat}`);
    }
    await sharpInstance.toFile(outputPath);
}
async function convertPdfToImage(inputPath, outputPath, targetFormat) {
    if (cloudConvert) {
        try {
            await convertWithCloudConvert(inputPath, outputPath, "pdf", targetFormat.toLowerCase());
            return;
        }
        catch (error) {
            console.error("CloudConvert PDF to Image failed, falling back to local:", error.message);
        }
    }
    const options = {
        density: 150,
        saveFilename: "temp-pdf-page",
        savePath: convertedDir,
        format: targetFormat.toLowerCase(),
        width: 1200,
        height: 1600,
    };
    const convert = (0, pdf2pic_1.fromPath)(inputPath, options);
    const result = await convert(1);
    if (result && result.path) {
        if (targetFormat === "PNG" || targetFormat === "JPG") {
            fs_1.default.renameSync(result.path, outputPath);
        }
        else {
            await convertImage(result.path, outputPath, targetFormat);
            fs_1.default.unlinkSync(result.path);
        }
    }
    else {
        throw new Error("Failed to convert PDF to image");
    }
}
async function convertPdfToText(inputPath, outputPath) {
    try {
        await execAsync(`pdftotext "${inputPath}" "${outputPath}"`);
    }
    catch (error) {
        if (error.stderr && error.stderr.includes("Syntax Error")) {
            throw new Error("The PDF file appears to be corrupted or invalid. Please try a different PDF file.");
        }
        throw new Error("Failed to extract text from PDF. Please ensure the PDF contains readable text.");
    }
}
async function convertPdfToWordBasic(inputPath, outputPath) {
    const tempTxtPath = inputPath + ".txt";
    try {
        // keep layout as much as possible and avoid page-break markers
        await execAsync(`pdftotext -layout -nopgbrk "${inputPath}" "${tempTxtPath}"`);
        const textContent = fs_1.default.readFileSync(tempTxtPath, "utf-8");
        const lines = textContent.split("\n");
        // use monospace font and explicit breaks to retain column alignment
        const doc = new docx_1.Document({
            styles: {
                default: {
                    document: {
                        run: { font: "Times New Roman", size: 24 }, // 12pt
                    },
                },
            },
            sections: [{
                    properties: {},
                    children: [
                        new docx_1.Paragraph({
                            children: lines.map((line, idx) => new docx_1.TextRun({
                                text: line || " ",
                                font: "Times New Roman",
                                size: 24,
                                break: idx === 0 ? undefined : 1,
                            })),
                        }),
                    ],
                }],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs_1.default.writeFileSync(outputPath, buffer);
        if (fs_1.default.existsSync(tempTxtPath)) {
            fs_1.default.unlinkSync(tempTxtPath);
        }
    }
    catch (error) {
        if (fs_1.default.existsSync(tempTxtPath)) {
            fs_1.default.unlinkSync(tempTxtPath);
        }
        console.error("PDF to WORD basic conversion error:", error);
        throw new Error("Failed to convert PDF to WORD. The PDF may not contain extractable text.");
    }
}
async function getPdfPageCount(inputPath) {
    const bytes = await fs_1.default.promises.readFile(inputPath);
    const doc = await pdf_lib_1.PDFDocument.load(bytes);
    return doc.getPageCount();
}
async function convertPdfToWordSnapshot(inputPath, outputPath) {
    const pageCount = await getPdfPageCount(inputPath);
    if (pageCount === 0) {
        throw new Error("PDF appears to be empty");
    }
    const options = {
        density: 180,
        saveFilename: `pdf-snapshot-${Date.now()}`,
        savePath: convertedDir,
        format: "png",
        width: 1200,
        height: 1600,
    };
    const convert = (0, pdf2pic_1.fromPath)(inputPath, options);
    const imagePaths = [];
    try {
        for (let page = 1; page <= pageCount; page++) {
            const result = await convert(page);
            if (!result || !result.path) {
                throw new Error(`Failed to render page ${page}`);
            }
            imagePaths.push(result.path);
        }
        const paragraphs = [];
        for (const imgPath of imagePaths) {
            const buffer = await fs_1.default.promises.readFile(imgPath);
            const meta = await (0, sharp_1.default)(buffer).metadata();
            paragraphs.push(new docx_1.Paragraph({
                children: [
                    new docx_1.ImageRun({
                        data: buffer,
                        transformation: {
                            width: meta.width ?? 1200,
                            height: meta.height ?? 1600,
                        },
                    }),
                ],
                spacing: { after: 300 },
            }));
        }
        const doc = new docx_1.Document({
            styles: {
                default: {
                    document: {
                        run: { font: "Times New Roman", size: 24 },
                    },
                },
            },
            sections: [
                {
                    properties: {},
                    children: paragraphs,
                },
            ],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs_1.default.writeFileSync(outputPath, buffer);
    }
    finally {
        for (const imgPath of imagePaths) {
            if (fs_1.default.existsSync(imgPath)) {
                fs_1.default.unlinkSync(imgPath);
            }
        }
    }
}
async function convertPdfToWord(inputPath, outputPath) {
    if (cloudConvert) {
        try {
            await convertWithCloudConvert(inputPath, outputPath, "pdf", "docx");
            return;
        }
        catch (error) {
            console.error("CloudConvert failed, falling back to basic conversion:", error.message);
        }
    }
    try {
        await convertPdfToWordSnapshot(inputPath, outputPath);
        return;
    }
    catch (error) {
        console.error("PDF snapshot-to-WORD fallback failed:", error.message);
    }
    await convertPdfToWordBasic(inputPath, outputPath);
}
function sanitizeTextForPdf(text) {
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[\uF000-\uFFFF]/g, '')
        .replace(/[^\x20-\x7E\n\t]/g, (char) => {
        const replacements = {
            '\u2022': '-', '\u2023': '-', '\u2043': '-',
            '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
            '\u2013': '-', '\u2014': '--', '\u2026': '...',
            '\u00A0': ' ', '\u00B7': '-',
        };
        return replacements[char] || ' ';
    });
}
async function convertWordToPdfBasic(inputPath, outputPath) {
    try {
        const result = await mammoth_1.default.extractRawText({ path: inputPath });
        let text = result.value;
        if (!text || text.trim().length === 0) {
            throw new Error("No text content found in the document");
        }
        text = sanitizeTextForPdf(text);
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const pageWidth = 612;
        const pageHeight = 792;
        const margin = 50;
        const fontSize = 12;
        const lineHeight = fontSize * 1.4;
        const maxWidth = pageWidth - 2 * margin;
        const font = await pdfDoc.embedFont("Courier");
        const lines = text.split("\n");
        const wrappedLines = [];
        // wrap using measured width to avoid mid-word breaks
        for (const line of lines) {
            const words = line.split(/(\s+)/);
            let current = "";
            for (const word of words) {
                const candidate = current + word;
                const width = font.widthOfTextAtSize(candidate, fontSize);
                if (width <= maxWidth || current.length === 0) {
                    current = candidate;
                }
                else {
                    wrappedLines.push(current.trimEnd());
                    current = word.trimStart();
                }
            }
            wrappedLines.push(current.trimEnd());
        }
        const linesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;
        let lineCount = 0;
        for (const line of wrappedLines) {
            if (lineCount >= linesPerPage) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
                lineCount = 0;
            }
            currentPage.drawText(line, {
                x: margin,
                y: y - lineHeight,
                size: fontSize,
                font,
            });
            y -= lineHeight;
            lineCount++;
        }
        const pdfBytes = await pdfDoc.save();
        fs_1.default.writeFileSync(outputPath, pdfBytes);
    }
    catch (error) {
        console.error("WORD to PDF basic conversion error:", error);
        throw new Error("Failed to convert WORD to PDF. The document may be corrupted.");
    }
}
async function convertWithCloudConvert(inputPath, outputPath, inputFormat, outputFormat) {
    if (!cloudConvert) {
        throw new Error("CloudConvert API key not configured");
    }
    try {
        const job = await cloudConvert.jobs.create({
            tasks: {
                "upload-file": {
                    operation: "import/upload",
                },
                "convert-file": {
                    operation: "convert",
                    input: "upload-file",
                    input_format: inputFormat,
                    output_format: outputFormat,
                },
                "export-file": {
                    operation: "export/url",
                    input: "convert-file",
                },
            },
        });
        const uploadTask = job.tasks.find((task) => task.name === "upload-file");
        if (!uploadTask) {
            throw new Error("Upload task not found");
        }
        const inputStream = fs_1.default.createReadStream(inputPath);
        await cloudConvert.tasks.upload(uploadTask, inputStream, path_1.default.basename(inputPath));
        const completedJob = await cloudConvert.jobs.wait(job.id);
        const exportTask = completedJob.tasks.find((task) => task.operation === "export/url");
        if (!exportTask || !exportTask.result || !exportTask.result.files || !exportTask.result.files[0]) {
            throw new Error("Export task failed or no output file");
        }
        const fileUrl = exportTask.result.files[0].url;
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to download converted file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fs_1.default.writeFileSync(outputPath, Buffer.from(arrayBuffer));
        console.log(`CloudConvert: Successfully converted ${inputFormat} to ${outputFormat}`);
    }
    catch (error) {
        console.error("CloudConvert error:", error);
        throw new Error(`CloudConvert conversion failed: ${error.message}`);
    }
}
async function convertWordToPdf(inputPath, outputPath, mimeType) {
    const isOldDoc = mimeType === "application/msword" || inputPath.toLowerCase().endsWith(".doc");
    const inputFormat = isOldDoc ? "doc" : "docx";
    if (cloudConvert) {
        try {
            await convertWithCloudConvert(inputPath, outputPath, inputFormat, "pdf");
            return;
        }
        catch (error) {
            console.error("CloudConvert failed, falling back to basic conversion:", error.message);
        }
    }
    if (isOldDoc) {
        throw new Error("Cannot convert .doc files without CloudConvert. Please use .docx format or ensure CloudConvert API key is configured.");
    }
    await convertWordToPdfBasic(inputPath, outputPath);
}
async function convertImageToPdf(inputPath, outputPath) {
    if (cloudConvert) {
        try {
            const ext = path_1.default.extname(inputPath).toLowerCase().replace(".", "");
            await convertWithCloudConvert(inputPath, outputPath, ext, "pdf");
            return;
        }
        catch (error) {
            console.error("CloudConvert Image to PDF failed, falling back to local:", error.message);
        }
    }
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const imageBuffer = fs_1.default.readFileSync(inputPath);
    const metadata = await (0, sharp_1.default)(inputPath).metadata();
    const width = metadata.width || 612;
    const height = metadata.height || 792;
    const pngBuffer = await (0, sharp_1.default)(inputPath).png().toBuffer();
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
    });
    const pdfBytes = await pdfDoc.save();
    fs_1.default.writeFileSync(outputPath, pdfBytes);
}
async function convertTextToPdf(inputPath, outputPath) {
    const text = fs_1.default.readFileSync(inputPath, "utf-8");
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 50;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const maxCharsPerLine = 80;
    const lines = text.split("\n");
    const wrappedLines = [];
    for (const line of lines) {
        if (line.length <= maxCharsPerLine) {
            wrappedLines.push(line);
        }
        else {
            let remaining = line;
            while (remaining.length > maxCharsPerLine) {
                let breakPoint = remaining.lastIndexOf(" ", maxCharsPerLine);
                if (breakPoint === -1)
                    breakPoint = maxCharsPerLine;
                wrappedLines.push(remaining.substring(0, breakPoint));
                remaining = remaining.substring(breakPoint).trim();
            }
            if (remaining)
                wrappedLines.push(remaining);
        }
    }
    const linesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    let lineCount = 0;
    const font = await pdfDoc.embedFont("Helvetica");
    for (const line of wrappedLines) {
        if (lineCount >= linesPerPage) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
            lineCount = 0;
        }
        currentPage.drawText(line, {
            x: margin,
            y: y - lineHeight,
            size: fontSize,
            font: font,
        });
        y -= lineHeight;
        lineCount++;
    }
    const pdfBytes = await pdfDoc.save();
    fs_1.default.writeFileSync(outputPath, pdfBytes);
}
async function registerRoutes(httpServer, app) {
    app.post("/api/convert", upload.single("file"), async (req, res) => {
        try {
            const file = req.file;
            const targetFormat = req.body.targetFormat;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: "No file uploaded. Please select a file to convert.",
                });
            }
            const validation = schema_1.conversionRequestSchema.safeParse({ targetFormat });
            if (!validation.success) {
                fs_1.default.unlinkSync(file.path);
                return res.status(400).json({
                    success: false,
                    error: `Invalid target format. Supported formats: ${schema_1.SUPPORTED_FORMATS.join(", ")}`,
                });
            }
            const originalFormat = getFormatFromMime(file.mimetype);
            const isImageSource = isImageMime(file.mimetype);
            const isPdfSource = isPdfMime(file.mimetype);
            const isTextSource = isTextMime(file.mimetype);
            const isImageTarget = IMAGE_FORMATS.includes(targetFormat);
            const originalName = path_1.default.parse(file.originalname).name;
            const outputFilename = `${originalName}-converted.${getExtensionFromFormat(targetFormat)}`;
            const outputPath = path_1.default.join(convertedDir, `${Date.now()}-${outputFilename}`);
            if (isImageSource && isImageTarget) {
                await convertImage(file.path, outputPath, targetFormat);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isImageSource && targetFormat === "PDF") {
                await convertImageToPdf(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isPdfSource && isImageTarget) {
                await convertPdfToImage(file.path, outputPath, targetFormat);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isPdfSource && targetFormat === "TXT") {
                await convertPdfToText(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isPdfSource && targetFormat === "WORD") {
                await convertPdfToWord(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            const isWordSource = isWordMime(file.mimetype);
            if (isWordSource && targetFormat === "PDF") {
                await convertWordToPdf(file.path, outputPath, file.mimetype);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isWordSource && targetFormat === "WORD") {
                fs_1.default.copyFileSync(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isTextSource && targetFormat === "PDF") {
                await convertTextToPdf(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            if (isTextSource && targetFormat === "TXT") {
                fs_1.default.copyFileSync(file.path, outputPath);
                fs_1.default.unlinkSync(file.path);
                return res.json({
                    success: true,
                    filename: outputFilename,
                    downloadUrl: `/api/download/${path_1.default.basename(outputPath)}`,
                    originalFormat,
                    targetFormat,
                });
            }
            fs_1.default.unlinkSync(file.path);
            let errorMessage = `Cannot convert ${originalFormat} to ${targetFormat}. `;
            if (isImageSource) {
                errorMessage += `Images can be converted to: ${IMAGE_FORMATS.join(", ")}, PDF.`;
            }
            else if (isPdfSource) {
                errorMessage += `PDFs can be converted to: ${IMAGE_FORMATS.join(", ")}, TXT, WORD.`;
            }
            else if (isWordSource) {
                errorMessage += `WORD documents can be converted to: PDF.`;
            }
            else if (isTextSource) {
                errorMessage += `Text files can be converted to: PDF, TXT.`;
            }
            else {
                errorMessage += "This file format is not supported for conversion.";
            }
            return res.status(400).json({
                success: false,
                error: errorMessage,
                originalFormat,
                targetFormat,
            });
        }
        catch (error) {
            console.error("Conversion error:", error);
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            const errorMessage = error?.message || "An error occurred during conversion. Please try again with a different file or format.";
            return res.status(500).json({
                success: false,
                error: errorMessage,
            });
        }
    });
    app.get("/api/download/:filename", (req, res) => {
        const { filename } = req.params;
        const filePath = path_1.default.join(convertedDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: "File not found. It may have been deleted or expired.",
            });
        }
        const originalFilename = filename.replace(/^\d+-/, "");
        res.download(filePath, originalFilename, (err) => {
            if (!err) {
                setTimeout(() => {
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                }, 60000);
            }
        });
    });
    app.get("/api/formats", (req, res) => {
        res.json({
            formats: schema_1.SUPPORTED_FORMATS,
            imageFormats: IMAGE_FORMATS,
        });
    });
    app.get("/api/visit", (req, res) => {
        const count = incrementVisitorCount();
        res.json({ count });
    });
    return httpServer;
}
//# sourceMappingURL=routes.js.map