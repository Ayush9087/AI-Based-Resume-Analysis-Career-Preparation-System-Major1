import { compareResumeSkills, normalizeSkillName } from './skillGapAnalyzer.js';

const contextSections = [
  ['education', 'Education'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['internships', 'Internships'],
];
const genericInterestWords = new Set(['career', 'role', 'job', 'work', 'developer', 'engineer', 'in']);

function asStrings(value) {
  if (Array.isArray(value)) return value.flatMap(asStrings);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (value && typeof value === 'object') return asStrings(value.name ?? value.title ?? value.description);
  return [];
}

function mentionsSkill(text, skillName) {
  const normalizedText = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const skillWords = skillName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const singularWords = skillWords.replace(/s(?=\s|$)/g, '');
  const variants = [skillWords, skillWords.replace(/\s+/g, ''), singularWords, singularWords.replace(/\s+/g, '')];
  const compactText = ` ${normalizeSkillName(text)} `;
  const compactSkill = normalizeSkillName(skillName);
  const compactSingular = compactSkill.endsWith('s') ? compactSkill.slice(0, -1) : compactSkill;

  return variants.some((variant) => variant && normalizedText.includes(` ${variant} `))
    || compactText.includes(` ${compactSkill} `)
    || compactText.includes(` ${compactSingular} `);
}

function collectContext(resume) {
  const parsed = resume.parsed_data ?? {};
  const sections = contextSections.map(([key, label]) => ({
    key,
    label,
    entries: asStrings(parsed[key]),
  }));
  return {
    sections,
    counts: Object.fromEntries(sections.map(({ key, entries }) => [key, entries.length])),
  };
}

function getTargetInterests(resume) {
  const parsed = resume.parsed_data ?? {};
  return [
    ...asStrings(parsed.target_interests),
    ...asStrings(parsed.targetInterests),
    ...asStrings(parsed.career_interests),
    ...asStrings(parsed.careerInterests),
    ...asStrings(parsed.career_goals),
    ...asStrings(parsed.target_roles),
  ];
}

function interestAligns(interests, roleTitle) {
  const normalizedRole = normalizeSkillName(roleTitle);
  return interests.some((interest) => {
    const normalizedInterest = normalizeSkillName(interest);
    if (!normalizedInterest) return false;
    if (normalizedInterest.includes(normalizedRole) || normalizedRole.includes(normalizedInterest)) return true;

    const roleWords = roleTitle.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !genericInterestWords.has(word));
    const interestWords = new Set(interest.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));
    return roleWords.length > 0 && roleWords.every((word) => interestWords.has(word));
  });
}

function buildRecommendation(resume, role) {
  const requirements = role.requirements ?? [];
  const { sections, counts } = collectContext(resume);
  const evidence = requirements.flatMap((requirement) => sections
    .filter((section) => section.entries.some((entry) => mentionsSkill(entry, requirement.name)))
    .map((section) => ({ skill: requirement.name, section: section.label })));
  const evidencedSkills = [...new Set(evidence.map((item) => item.skill))];
  const parsedData = resume.parsed_data ?? {};
  const originalSkills = Array.isArray(parsedData.skills) ? parsedData.skills : [];
  const comparison = compareResumeSkills({
    ...resume,
    parsed_data: { ...parsedData, skills: [...originalSkills, ...evidencedSkills] },
  }, requirements);
  const interests = getTargetInterests(resume);
  const interestMatch = interestAligns(interests, role.title);
  const relevantEvidenceSections = [...new Set(evidence.map((item) => item.section))];
  const explanation = [
    `Your resume documents ${comparison.summary.matched} of ${comparison.summary.totalRequired} required skills for ${role.title}.`,
    evidence.length ? `Relevant skill evidence appears in: ${relevantEvidenceSections.join(', ')}.` : 'No additional required skills were identified in education, project, or experience details.',
    interests.length
      ? (interestMatch ? 'This role also aligns with a stated career interest.' : 'This recommendation is based on resume evidence; no direct match with the stated interests was found.')
      : 'No target interest was provided, so this suggestion is based on resume evidence only.',
    'Use this as career exploration guidance, not a guaranteed career outcome.',
  ].join(' ');

  return {
    role: { id: role.id, title: role.title, description: role.description },
    skillMatchPercent: comparison.summary.matchPercent,
    fitScore: requirements.length
      ? Math.round(((comparison.summary.matched + (comparison.summary.needsImprovement * 0.5)) / requirements.length) * 100)
      : 0,
    matchingSkills: comparison.matchingSkills,
    missingSkills: comparison.missingSkills,
    skillsNeedingImprovement: comparison.skillsNeedingImprovement,
    suggestedPreparationAreas: comparison.recommendedLearningAreas,
    explanation,
    evidence: { sectionCounts: counts, skillMentions: evidence, interestMatch },
    skillRequirements: requirements,
  };
}

export function buildCareerRecommendations(resume, roles) {
  return roles
    .filter((role) => role.requirements?.length)
    .map((role) => buildRecommendation(resume, role))
    .sort((left, right) => (
      right.fitScore - left.fitScore
      || Number(right.evidence.interestMatch) - Number(left.evidence.interestMatch)
      || left.role.title.localeCompare(right.role.title)
    ));
}