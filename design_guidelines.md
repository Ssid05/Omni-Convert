# File Converter Application - Design Guidelines

## Design Approach

**System Selected**: Material Design-inspired utility interface
**Rationale**: File converters are utility-focused tools where clarity, feedback, and efficiency are paramount. Material Design provides excellent patterns for file uploads, dropdowns, and progress indication.

**Core Principles**:
- Clarity over decoration
- Immediate visual feedback for all interactions
- Single-purpose focus: get users converting files quickly
- Professional, trustworthy appearance

---

## Layout System

**Spacing Units**: Tailwind units of 4, 6, 8, 12, 16, 24
- Small gaps/padding: 4-6
- Standard spacing: 8-12
- Section spacing: 16-24

**Container Structure**:
- Main converter card: max-w-2xl centered with px-6 py-8
- Full viewport height centering on desktop
- Mobile: py-12 with natural flow

---

## Typography

**Font Stack**: 
- Primary: Inter (Google Fonts) - clean, modern, highly legible
- Monospace: 'Roboto Mono' for file names/formats

**Hierarchy**:
- App title: text-3xl font-bold
- Section headers: text-xl font-semibold
- Body/labels: text-base font-medium
- Helper text: text-sm text-gray-600
- File names: text-sm font-mono

---

## Component Library

### File Upload Zone
**Design**: Large drag-and-drop area with clear visual states
- Default: Dashed border (border-2 border-dashed), substantial padding (py-16)
- Hover: Subtle background change, border color intensification
- Active (dragging): Stronger visual emphasis
- With file: Solid border, show file info card inside

**Content**:
- Icon: Upload cloud icon (large, 48px)
- Primary text: "Drag and drop your file here"
- Secondary: "or click to browse" (smaller, lighter)
- File info display: File name (bold, mono), size, format badge

### Format Dropdown
**Critical**: Full-width select with all formats always visible
- Height: h-12 for easy clicking
- Clear label above: "Convert to"
- Format options displayed as: "PNG", "JPG", "WEBP", "TIFF", "PDF", "TXT", "DOC", "DOCX"
- Selected state: Bold with checkmark icon
- Disabled state (no file uploaded): Grayed but all options still visible

### Convert Button
**Design**: Primary action button
- Full-width on mobile, fixed width (min-w-48) on desktop
- Height: h-12 for consistency
- States:
  - Default: Solid background
  - Disabled (no file): Reduced opacity
  - Converting: Loading spinner + "Converting..." text
  - Success: Checkmark icon briefly before download

### Status/Feedback Panel
**Position**: Below convert button, min-h-20 reserved
- Success: Green accent with download link + file icon
- Error: Red accent with clear error message
- Processing: Progress indicator with percentage if available

### Header
**Layout**: Simple top bar with app branding
- Logo/icon + "File Converter" title (left)
- Minimal, mb-12 spacing from main content
- Optional: Small "About" or "Supported Formats" link (right)

---

## Page Layout

**Single-Page Application Structure**:

1. **Header** (py-6)
   - Centered or left-aligned logo + title
   
2. **Main Converter Card** (centered, elevated)
   - Upload zone (largest visual element)
   - Spacing: mb-6
   - Format dropdown with label
   - Spacing: mb-6
   - Convert button
   - Spacing: mb-4
   - Status panel

3. **Footer** (optional, py-8)
   - Supported formats list in small grid
   - Brief instruction or tip

**Visual Hierarchy**:
- Upload zone dominates (40% of card space)
- Equal visual weight to dropdown and button
- Status panel flexible but always present

---

## Interaction Patterns

**File Upload Flow**:
1. Upload zone prominent on page load
2. File dropped/selected → Zone compresses, shows file card
3. Dropdown becomes active (was already showing all options)
4. Convert button activates
5. Click converts → Button shows loading state
6. Success → Download link appears in status panel
7. "Convert Another" action clears state

**Animations**: Minimal, functional only
- Smooth height transitions when file is added (300ms)
- Loading spinner for convert button
- Fade-in for status messages (200ms)
- No decorative animations

---

## Special Considerations

**Dropdown Emphasis**:
Since all formats must always show, make this visually clear:
- Add helper text above: "Select any format (no restrictions)"
- Use a distinct icon next to label
- Sufficient height to show options comfortably

**Error Messaging**:
- Clear, user-friendly language
- Example: "Cannot convert TXT to PNG. Try converting to PDF or DOC instead."
- No technical jargon

**Mobile Optimization**:
- Stack all elements vertically
- Upload zone: py-12 (reduced from desktop)
- Full-width buttons and dropdowns
- Adequate touch targets (min h-12)

---

## Images

**No hero image required** - this is a utility tool.

**Icons**:
- Upload cloud icon in upload zone
- Format-specific icons for file badges (PDF icon, image icon, doc icon)
- Download icon for success state
- Use Heroicons (outline style) via CDN

**Optional Visual Enhancement**:
Small illustration/icon next to app title showing file conversion concept (file → arrow → file)