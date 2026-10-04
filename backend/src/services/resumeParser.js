import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const sectionLabels = new Map([
  ['education', 'education'],
  ['academicbackground', 'education'],
  ['academics', 'education'],
  ['qualifications', 'education'],
  ['skills', 'skills'],
  ['technicalskills', 'skills'],
  ['coreskills', 'skills'],
  ['competencies', 'skills'],
  ['projects', 'projects'],
  ['personalprojects', 'projects'],
  ['academicprojects', 'projects'],
  ['internships', 'internships'],
  ['internshipexperience', 'internships'],
  ['experience', 'experience'],
  ['workexperience', 'experience'],
  ['professionalexperience', 'experience'],
  ['employment', 'experience'],
  ['certifications', 'certifications'],
  ['certificates', 'certifications'],
  ['licenses', 'certifications'],
  ['achievements', 'achievements'],
  ['awards', 'achievements'],
  ['honors', 'achievements'],
  ['accomplishments', 'achievements'],
]);

function cleanTextLines(text) {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^\s*[•●▪‣*-]+\s*/, '').trim())
    .filter(Boolean);
}

function normalizeHeading(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractSections(lines) {
  const sections = {
    education: [],
    skills: [],
    projects: [],
    internships: [],
    experience: [],
    certifications: [],
    achievements: [],
  };
  let activeSection = null;

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    const headingText = colonIndex >= 0 ? line.slice(0, colonIndex) : line;
    const section = sectionLabels.get(normalizeHeading(headingText));

    if (section) {
      activeSection = section;
      const remainder = colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : '';
      if (remainder) sections[section].push(remainder);
      continue;
    }

    if (activeSection) sections[activeSection].push(line);
  }

  sections.skills = sections.skills.flatMap((line) => line.split(/[,;|]/).map((skill) => skill.trim()).filter(Boolean));
  return sections;
}

function extractContact(lines, text) {
  const email = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase() ?? null;
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;
  const name = lines.find((line) => (
    line.length <= 80
    && !line.includes('@')
    && !/https?:\/\//i.test(line)
    && !/\d{7}/.test(line)
    && !sectionLabels.has(normalizeHeading(line))
  )) ?? null;
  const explicitLocation = lines.find((line) => /^(location|address)\s*:/i.test(line));
  const location = explicitLocation?.replace(/^(location|address)\s*:/i, '').trim()
    || lines.slice(0, 8).find((line) => line.includes(',') && !line.includes('@') && !/\d{7}/.test(line))
    || null;

  return { name, email, phone, location };
}

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractResumeData(buffer, fileType) {
  let text;

  if (fileType === 'application/pdf') {
    text = await extractPdfText(buffer);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    throw new Error('Only PDF and DOCX resumes can be processed.');
  }

  const lines = cleanTextLines(text);
  if (lines.length === 0) {
    const error = new Error('No readable text was found. The file may be scanned; upload a text-based PDF or DOCX.');
    error.statusCode = 422;
    error.expose = true;
    throw error;
  }

  return {
    ...extractContact(lines, text),
    ...extractSections(lines),
  };
}