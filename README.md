# PDF Tools in pure JavaScript

Here are several **tools related to PDF files** that you can build using **pure JavaScript (vanilla JS)** — no frameworks needed. Some may require the use of browser APIs or lightweight libraries (like PDF.js), but the logic/UI can still be built in plain JS.

---

### 🧰 **PDF Tools You Can Build with Pure JavaScript**

#### 🔍 1. **PDF Viewer**

* **What it does:** Displays the content of a PDF file.
* **How:** Use the [PDF.js library](https://mozilla.github.io/pdf.js/) from Mozilla (can be embedded without a framework).
* **Enhancements:** Zoom, next/prev page, search text.

#### ✏️ 2. **PDF Annotator**

* **What it does:** Let users draw or add text on top of a PDF.
* **How:** Render PDF with canvas (via PDF.js), then overlay annotation layers (with HTML5 canvas or SVG).

#### 📥 3. **PDF Downloader from URL**

* **What it does:** Input a PDF URL and download it to local device.
* **How:** Use `fetch()` to get the blob, and `URL.createObjectURL()` to trigger download.

#### 📄 4. **PDF to Text Extractor**

* **What it does:** Extract plain text from a PDF file.
* **How:** Again, use PDF.js to parse pages and extract text content.

#### 📊 5. **PDF Metadata Reader**

* **What it does:** Reads basic metadata (title, author, creation date).
* **How:** PDF.js or raw parsing (more advanced, but possible with ArrayBuffer and DataView).

#### 🖼️ 6. **PDF to Image (Pages Preview)**

* **What it does:** Convert pages of a PDF to PNG or JPG images.
* **How:** Render each page with canvas and export via `canvas.toDataURL()`.

#### 🔐 7. **Password-Protected PDF Checker**

* **What it does:** Detects if a PDF is encrypted and prompts for a password.
* **How:** PDF.js has error handling for this (requires slight customization).

#### 🗃️ 8. **PDF Merger Tool (Basic)**

* **What it does:** Combine multiple PDFs into one.
* **How:** Requires a bit more than pure JS in browser — but can be done using [pdf-lib](https://pdf-lib.js.org/), a zero-dependency JS library that works in browser (no Node needed).

#### ✂️ 9. **PDF Splitter**

* **What it does:** Select specific pages to extract into a new PDF.
* **How:** Use `pdf-lib` to manipulate the PDF and export selected pages.

#### 📝 10. **HTML to PDF Converter**

* **What it does:** Convert a section of a webpage or content to PDF.
* **How:** Use `window.print()` (basic), or use `html2canvas` + `jsPDF` (both can be included via `<script>` tags).

#### 🔄 11. **Drag & Drop PDF Reader**

* **What it does:** User drags a PDF file into the browser, and it renders/reads the content.
* **How:** Combine FileReader + PDF.js for seamless experience.

---

### ✅ Tools Requiring ONLY Vanilla JS + Browser APIs:

These don't even need external libraries:

* PDF Downloader
* Drag & Drop Reader (basic file details)
* PDF Metadata Inspector (basic parsing)
* HTML to PDF via `window.print()`

---

### Want to Build One?

If you'd like, I can:

* Help you build a **simple PDF reader tool** from scratch.
* Give you a **starter template** for a PDF-to-text tool.
* Show how to **extract all text from a PDF** using JS in-browser.

Let me know which direction you'd like to go!
