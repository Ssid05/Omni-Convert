# Omni-Convert 🔄

Omni-Convert is a **universal file converter web application** that allows users to upload **any file** and choose **any output format** from a single dropdown.

The key idea is **freedom of choice**:
👉 No filtering of options based on file type.  
👉 All conversion formats are always visible.

---

## 🚀 Features

- 📂 Upload any file (PDF, JPG, PNG, TXT, DOC, DOCX, etc.)
- 🔽 “Convert to” dropdown always shows **ALL formats**
- 🖼 Image-to-image conversion using **Sharp**
- 📄 Basic document conversions (PDF ↔ TXT, DOC/DOCX attempts)
- ⚠️ Friendly error messages for unsupported conversions
- ⬇️ Download converted files instantly
- 🧮 **Endless visitor counter** (counts every visit, never resets)
- 🎨 Clean and simple UI
- 🌐 Deployed and production-ready

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript
- Multer (file uploads)
- Sharp (image processing)

### Storage
- In-memory + file-based persistence
- No database required

---

## 🔁 How It Works

1. User uploads any file
2. App detects the file
3. Dropdown displays **all available formats**
4. User selects a target format
5. App attempts conversion
6. Converted file is available for download  
   - If conversion is unsupported → clear error message shown

---

## 📊 Visitor Counter

- Counts every visit from any device
- Stored persistently
- Never resets
- Displayed on the homepage

---

## 🧪 Development

```bash
npm install
npm run dev
