/* eslint-disable @typescript-eslint/no-explicit-any */

export async function renderHtmlToPdf(
  htmlContent: string,
  filename: string,
  pageHeight = 1123,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);

  // The content is rendered off-screen in the current document (not an
  // iframe via document.write, and not visibility:hidden — html2canvas
  // silently produces a blank/unstyled capture in both of those cases).
  const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const css = (styleMatch?.[1] ?? '').replace(/\bbody\s*\{/g, '.pdf-export-root{');
  const bodyHtml = bodyMatch?.[1] ?? htmlContent;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const container = document.createElement('div');
  container.className = 'pdf-export-root';
  container.style.cssText = `
    position: absolute;
    left: -10000px;
    top: 0;
    width: 794px;
    min-height: ${pageHeight}px;
  `;
  container.innerHTML = bodyHtml;
  document.body.appendChild(container);

  try {
    if (!container.innerHTML.trim()) {
      throw new Error('Contenu PDF vide');
    }

    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794,
      width: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const usableHeight = pdfPageHeight - margin * 2;

    let heightLeft = imgHeight;
    let position = margin;
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save(filename);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    if (document.head.contains(styleEl)) {
      document.head.removeChild(styleEl);
    }
  }
}

export async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
