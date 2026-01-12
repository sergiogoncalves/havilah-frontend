import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-documento',
  templateUrl: './documento.component.html',
  styleUrls: ['./documento.component.scss']
})
export class DocumentoComponent implements OnInit, OnDestroy {
  safeHtml: SafeHtml | null = null;
  rawHtml: string | null = null;
  title = 'Documento';

  @ViewChild('docContainer', { static: false }) docContainer?: ElementRef<HTMLDivElement>;

  private sub?: any;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Accept HTML via query param "html" (URL-encoded) or via state navigation
    this.sub = this.route.queryParams.subscribe(params => {
      const htmlParam = params['html'];
      if (htmlParam) {
        try {
          // If encoded, decode; if not, use directly
          const decoded = decodeURIComponent(htmlParam);
          this.setHtml(decoded);
        } catch {
          this.setHtml(htmlParam);
        }
      }
    });

    // Also try reading from history state
    const nav = history.state;
    if (nav && nav.html && !this.rawHtml) {
      this.setHtml(nav.html);
    }

    if (nav && nav.title) {
      this.title = nav.title;
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe?.();
    }
  }

  setHtml(html: string) {
    this.rawHtml = html;
    // Sanitize with bypassSecurityTrustHtml only for trusted source
    this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  async generatePdf() {
    const element = this.docContainer?.nativeElement;
    if (!element) return;

    // Use html2canvas to render the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');

    // Create PDF with A4 size (pt). jsPDF default is portrait A4 210x297mm => 595x842pt
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Compute image dimensions to fit width, preserve aspect ratio
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    } else {
      // Split across multiple pages
      let heightLeft = imgHeight;
      let y = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          y = - (imgHeight - heightLeft);
        }
      }
    }

    const filename = (this.title || 'documento') + '.pdf';
    pdf.save(filename);
  }
}

