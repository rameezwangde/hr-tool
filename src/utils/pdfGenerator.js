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
  const scrollContainers = element.querySelectorAll('.overflow-auto, .overflow-scroll, [class*="max-h-"]');
  const restoredStyles = [];
  scrollContainers.forEach(container => {
    restoredStyles.push({
      element: container,
      maxHeight: container.style.maxHeight,
      height: container.style.height,
      overflow: container.style.overflow,
      className: container.className
    });
    container.style.maxHeight = 'none';
    container.style.height = 'auto';
    container.style.overflow = 'visible';
    // Strip max-height and overflow Tailwind utility classes
    container.className = container.className.replace(/\bmax-h-\S+/g, '').replace(/\boverflow-\S+/g, '');
  });

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');

    // Automatically choose orientation based on element dimensions
    const isLandscape = canvas.width > canvas.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm (portrait) or 297mm (landscape)
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm (portrait) or 210mm (landscape)

    // Canvas dimensions in mm (matching the pdf page width)
    const canvasWidthMm = pdfWidth;
    const canvasHeightMm = (canvas.height / canvas.width) * canvasWidthMm;

    // How many pages do we need?
    const totalPages = Math.ceil(canvasHeightMm / pdfHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // y offset in mm for this page
      const yOffsetMm = page * pdfHeight;

      // Add image positioned so only the current page's slice is visible
      pdf.addImage(
        imgData,
        'PNG',
        0,
        -yOffsetMm,          // shift image up by the page offset
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
