/* eslint-disable @typescript-eslint/no-explicit-any */

export async function renderHtmlToPdf(
  htmlContent: string,
  filename: string,
  pageHeight = 1123,
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 794px;
    height: ${pageHeight}px;
    border: none;
    visibility: hidden;
    z-index: 99999;
  `;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument
      ?? iframe.contentWindow?.document;
    if (!doc) throw new Error('iframe indisponible');

    doc.open();
    doc.write(htmlContent);
    doc.close();

    await new Promise((r) => setTimeout(r, 1200));

    const element = doc.body;
    if (!element?.innerHTML?.trim()) {
      throw new Error('Contenu PDF vide');
    }

    await html2pdf()
      .set({
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 794,
          width: 794,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      })
      .from(element)
      .save();

    await new Promise((r) => setTimeout(r, 300));
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
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
