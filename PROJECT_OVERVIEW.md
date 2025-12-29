# Omni-Convert Project Overview

**Date**: December 28, 2025  
**Status**: ✅ No Errors - Project Compiles Successfully

---

## 📋 Project Summary

**Omni-Convert** is a full-stack file conversion web application that allows users to convert files between multiple formats. It features a modern React frontend with a Node.js/Express backend, supporting image formats, PDFs, text documents, and Word files.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **UI Components**: Custom Radix UI-based component library (47 components)
- **State Management**: TanStack React Query v5
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React, React Icons
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js with TypeScript (tsx)
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express Session + connect-pg-simple
- **File Handling**: Multer
- **Image Processing**: Sharp.js
- **PDF Operations**: pdf-lib, pdf-parse, pdf2pic
- **Document Processing**: mammoth (Word docs), docx (generate Word)
- **API Integration**: CloudConvert API for advanced conversions
- **WebSockets**: ws

### Shared
- **Schema & Validation**: Zod schemas shared between client/server

### Configuration
- **TypeScript**: Strict mode enabled, paths configured
- **Build**: Custom build script (script/build.ts)
- **Database**: Drizzle with PostgreSQL

---

## 📁 Project Structure

```
Omni-Convert/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/             # 47 reusable UI components
│   │   ├── pages/
│   │   │   ├── home.tsx        # Main conversion interface
│   │   │   └── not-found.tsx   # 404 page
│   │   ├── hooks/              # Custom hooks (toast, mobile detection)
│   │   ├── lib/                # Utilities & query client
│   │   ├── App.tsx             # Router & provider setup
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── index.html
│   └── public/
│       └── favicon.png
│
├── server/                      # Express backend
│   ├── index.ts                # Server setup & logging
│   ├── routes.ts               # API endpoints (728 lines)
│   ├── static.ts               # Static file serving
│   ├── storage.ts              # Database operations
│   └── vite.ts                 # Vite integration
│
├── shared/                      # Shared TypeScript
│   └── schema.ts               # Zod schemas & types
│
├── script/
│   └── build.ts                # Custom build script
│
├── uploads/                    # Temporary file storage
├── converted/                  # Output files directory
│
├── Configuration Files:
│   ├── package.json            # Dependencies & scripts
│   ├── tsconfig.json           # TypeScript config (strict mode)
│   ├── vite.config.ts          # Vite bundler config
│   ├── tailwind.config.ts      # Tailwind styling
│   ├── postcss.config.js       # PostCSS plugins
│   ├── drizzle.config.ts       # ORM config
│   └── components.json         # Shadcn UI config
│
├── Documentation:
│   └── design_guidelines.md    # UI/UX design specs
│
└── visitor_count.json          # Visitor tracking data
```

---

## 🎯 Key Features

### Supported File Formats
- **Image Formats**: PNG, JPG, WEBP, TIFF
- **Document Formats**: PDF, TXT, WORD (docx)
- **Total**: 7 supported formats

### Conversion Capabilities
- **Image-to-Image**: PNG ↔ JPG ↔ WEBP ↔ TIFF
- **Image-to-PDF**: Convert images to PDF
- **PDF Operations**: 
  - PDF to image (TIFF, PNG)
  - PDF to text extraction
- **Document Processing**:
  - Word (docx) ↔ PDF
  - Document text extraction
- **Advanced Conversions**: CloudConvert API integration for edge cases

### User Experience
- **Drag & Drop Upload**: Intuitive file selection
- **Real-time Status**: Uploading → Converting → Success/Error states
- **File Preview**: Display original format, size, and file information
- **Download Results**: Direct download of converted files
- **Visitor Tracking**: Count active users
- **Responsive Design**: Mobile-friendly Material Design interface

---

## 🔧 API Routes

### GET Endpoints
- `GET /api/visit` - Increment & return visitor count
- `GET /api/formats` - List supported formats
- `GET /converted/:filename` - Download converted file

### POST Endpoints
- `POST /api/convert` - Main conversion endpoint
  - Accepts multipart form data with file
  - Validates target format
  - Returns download URL on success

### File Handling
- **Upload Storage**: `/uploads` directory (max 50MB per file)
- **Converted Files**: `/converted` directory with timestamp prefixes
- **Cleanup**: Converted files persist (can be cleaned up manually)

---

## 📊 Database Schema

Uses Drizzle ORM with PostgreSQL:
- **Connection**: Via `connect-pg-simple` for session storage
- **Purpose**: User sessions and conversion history
- **Current**: Basic session management setup

---

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost with hot reload)

# Production
npm run build           # Build for production
npm start               # Run production build

# Database
npm run db:push         # Sync schema with database

# Validation
npm check               # TypeScript type checking
```

---

## 🎨 Design System

- **Material Design** inspired utility-focused interface
- **Typography**: Inter font for clean, modern appearance
- **Colors**: Standard Tailwind palette with semantic colors
- **Spacing**: 4px unit system (4, 6, 8, 12, 16, 24)
- **Responsive**: Mobile-first design with breakpoints
- **Interactive Feedback**: Loading states, success/error messages, progress indicators

---

## 📦 Dependencies Summary

**Core**: Express, React, TypeScript, Vite
**UI**: Radix UI (47 components), Tailwind CSS, Shadcn UI
**State**: React Query, Zod validation
**File Processing**: Sharp, pdf-lib, mammoth, docx
**Database**: Drizzle ORM, PostgreSQL driver
**Utilities**: date-fns, clsx, tailwind-merge

**Total Package Size**: 109 dependencies (incl. dev dependencies)

---

## ✅ Project Status

- **Build Status**: ✅ No errors
- **TypeScript**: ✅ Strict mode, all types valid
- **File Structure**: ✅ Well organized
- **Config Files**: ✅ All properly configured
- **Dependencies**: ✅ All resolved

---

## 🔐 Environment Variables Required

```
CLOUDCONVERT_API_KEY    # For advanced file conversions
NODE_ENV                # development | production
DATABASE_URL            # PostgreSQL connection string
```

---

## 📝 Notes

- **File Size Limit**: 50MB per upload
- **Converted Files**: Stored with timestamp prefix for uniqueness
- **Session Storage**: PostgreSQL-backed sessions
- **API Response Format**: JSON with standardized ConversionResponse schema
- **Error Handling**: Comprehensive error messages returned to client
- **Visitor Tracking**: JSON file-based counter at root level

---

## 🎬 Next Steps / Maintenance

- Monitor converted files directory size
- Consider cleanup policy for old conversions
- Test CloudConvert API integration with various formats
- Optimize large file processing
- Implement user authentication if needed
- Add conversion history per user (database feature available)

---

**Generated**: December 28, 2025 | **Last Updated**: Project Scan Complete
