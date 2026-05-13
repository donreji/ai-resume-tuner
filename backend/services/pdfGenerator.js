import PDFDocument from 'pdfkit';
import fs from 'fs';

const DARK = '#1a1a2e';
const BODY = '#222222';
const MUTED = '#555555';
const LINE = '#cccccc';

function sectionHeader(doc, title) {
  doc.moveDown(0.6)
    .font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(title.toUpperCase())
    .moveDown(0.15);
  const y = doc.y;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(LINE).stroke()
    .moveDown(0.3);
}

function renderExperience(doc, text) {
  const entries = text.split(/\n{2,}/).filter(e => e.trim());
  for (const entry of entries) {
    const lines = entry.split('\n').filter(l => l.trim());
    if (!lines.length) continue;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(BODY).text(lines[0].trim());
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const bullet = line.startsWith('-') ? `• ${line.slice(1).trim()}` : line;
      doc.font('Helvetica').fontSize(9.5).fillColor(BODY).text(bullet, { indent: 14 });
    }
    doc.moveDown(0.35);
  }
}

export function generatePDF(sections, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    // Name
    doc.font('Helvetica-Bold').fontSize(22).fillColor(DARK)
      .text(sections.name || 'Candidate Name', { align: 'center' });

    // Contact
    if (sections.contact) {
      doc.moveDown(0.25)
        .font('Helvetica').fontSize(9.5).fillColor(MUTED)
        .text(sections.contact, { align: 'center' });
    }

    // Divider
    doc.moveDown(0.5)
      .moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
      .strokeColor('#888888').stroke().moveDown(0.4);

    // Summary
    if (sections.summary) {
      sectionHeader(doc, 'Professional Summary');
      doc.font('Helvetica').fontSize(10).fillColor(BODY).text(sections.summary);
    }

    // Experience
    if (sections.experience) {
      sectionHeader(doc, 'Experience');
      renderExperience(doc, sections.experience);
    }

    // Skills
    if (sections.skills) {
      sectionHeader(doc, 'Skills');
      doc.font('Helvetica').fontSize(10).fillColor(BODY).text(sections.skills);
    }

    // Education
    if (sections.education) {
      sectionHeader(doc, 'Education');
      doc.font('Helvetica').fontSize(10).fillColor(BODY).text(sections.education);
    }

    doc.end();
  });
}
