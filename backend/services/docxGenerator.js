import { Document, Paragraph, TextRun, AlignmentType, BorderStyle, Packer } from 'docx';
import fs from 'fs';

function sectionHeading(title) {
  return new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: '1a1a2e' })],
    spacing: { before: 300, after: 80 },
    border: { bottom: { color: 'cccccc', space: 1, style: BorderStyle.SINGLE, size: 6 } },
  });
}

function bodyPara(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '222222', ...opts })],
    spacing: { after: 60 },
  });
}

function bulletPara(text) {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 20, color: '222222' })],
    indent: { left: 240 },
    spacing: { after: 40 },
  });
}

function parseExperienceParas(text) {
  const paras = [];
  const entries = text.split(/\n{2,}/).filter(e => e.trim());
  for (const entry of entries) {
    const lines = entry.split('\n').filter(l => l.trim());
    if (!lines.length) continue;
    paras.push(new Paragraph({
      children: [new TextRun({ text: lines[0].trim(), bold: true, size: 20 })],
      spacing: { after: 60 },
    }));
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      paras.push(bulletPara(line.startsWith('-') ? line.slice(1).trim() : line));
    }
    paras.push(new Paragraph({ text: '', spacing: { after: 100 } }));
  }
  return paras;
}

export async function generateDOCX(sections, outputPath) {
  const children = [];

  // Name
  children.push(new Paragraph({
    children: [new TextRun({ text: sections.name || 'Candidate Name', bold: true, size: 44, color: '1a1a2e' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
  }));

  // Contact
  if (sections.contact) {
    children.push(new Paragraph({
      children: [new TextRun({ text: sections.contact, size: 18, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }

  // Summary
  if (sections.summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(bodyPara(sections.summary));
  }

  // Experience
  if (sections.experience) {
    children.push(sectionHeading('Experience'));
    children.push(...parseExperienceParas(sections.experience));
  }

  // Skills
  if (sections.skills) {
    children.push(sectionHeading('Skills'));
    children.push(bodyPara(sections.skills));
  }

  // Education
  if (sections.education) {
    children.push(sectionHeading('Education'));
    children.push(bodyPara(sections.education));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}
