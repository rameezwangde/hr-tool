import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const exportToPDF = async (elementId, filename = "document.pdf") => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const stylesWithOklch = [];
  const styleElements = Array.from(document.querySelectorAll('style'));

  // Intercept window.getComputedStyle to dynamically replace oklch/oklab colors returned as computed styles
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (el, pseudoEl) {
    const style = originalGetComputedStyle.call(window, el, pseudoEl);
    if (!style) return style;

    return new Proxy(style, {
      get(target, prop) {
        const value = target[prop];
        if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
          return value.replace(/(oklch|oklab)\([^)]+\)/g, 'rgb(0,0,0)');
        }
        if (typeof value === 'function') {
          return function (...args) {
            const res = target[prop].apply(target, args);
            if (typeof res === 'string' && (res.includes('oklch') || res.includes('oklab'))) {
              return res.replace(/(oklch|oklab)\([^)]+\)/g, 'rgb(0,0,0)');
            }
            return res;
          };
        }
        return value;
      }
    });
  };

  // Temporary replacement of oklch/oklab to prevent html2canvas from crashing
  styleElements.forEach(style => {
    try {
      if (style.innerHTML && (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab'))) {
        stylesWithOklch.push({ element: style, originalText: style.innerHTML });
        style.innerHTML = style.innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, 'rgb(0,0,0)');
      }
    } catch (e) {
      console.warn("Could not modify style innerHTML", e);
    }
  });

  // Temporarily expand scrollable child containers so html2canvas captures the full size
  const scrollContainers = element.querySelectorAll('.overflow-auto, .overflow-scroll, [class*="max-h-"], [class*="overflow-x-"]');
  const restoredStyles = [];
  scrollContainers.forEach(container => {
    restoredStyles.push({
      element: container,
      maxHeight: container.style.maxHeight,
      height: container.style.height,
      overflow: container.style.overflow,
      width: container.style.width,
      className: container.className
    });
    container.style.maxHeight = 'none';
    container.style.height = 'auto';
    container.style.overflow = 'visible';
    // Strip max-height and overflow Tailwind utility classes
    container.className = container.className.replace(/\bmax-h-\S+/g, '').replace(/\boverflow-\S+/g, '');
  });

  try {
    const fullWidth = Math.max(element.scrollWidth, element.offsetWidth, 1200);
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: fullWidth + 100,
      windowHeight: element.scrollHeight + 100,
    });

    const imgData = canvas.toDataURL('image/png');

    // Automatically choose orientation based on element dimensions
    const isLandscape = canvas.width >= canvas.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm (landscape) or 210mm (portrait)
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm (landscape) or 297mm (portrait)

    const margin = 8;
    const usableWidth = pdfWidth - (margin * 2);
    const canvasWidthMm = usableWidth;
    const canvasHeightMm = (canvas.height / canvas.width) * canvasWidthMm;

    const usableHeight = pdfHeight - (margin * 2);
    const totalPages = Math.ceil(canvasHeightMm / usableHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const yOffsetMm = page * usableHeight;
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin - yOffsetMm,
        canvasWidthMm,
        canvasHeightMm
      );
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF", error);
    alert("Error generating PDF: " + error.message);
  } finally {
    // Restore window.getComputedStyle
    window.getComputedStyle = originalGetComputedStyle;

    // Restore original styles
    stylesWithOklch.forEach(item => {
      try {
        item.element.innerHTML = item.originalText;
      } catch (e) {
        console.warn("Could not restore style innerHTML", e);
      }
    });

    // Restore original overflow and dimensions
    restoredStyles.forEach(item => {
      item.element.style.maxHeight = item.maxHeight;
      item.element.style.height = item.height;
      item.element.style.overflow = item.overflow;
      if (item.width !== undefined) item.element.style.width = item.width;
      item.element.className = item.className;
    });
  }
};

export const printDocument = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printContents = element.innerHTML;
  const originalContents = document.body.innerHTML;

  document.body.innerHTML = `
    <div class="print-only">
      ${printContents}
    </div>
  `;
  window.print();
  
  // Restore original content and reload app to reattach event listeners
  document.body.innerHTML = originalContents;
  window.location.reload(); 
};
