const proficiencyLevels = new Map([
  ['novice', 0],
  ['beginner', 0],
  ['basic', 0],
  ['entry', 0],
  ['intermediate', 1],
  ['moderate', 1],
  ['proficient', 2],
  ['advanced', 3],
  ['expert', 4],
]);

const skillAliases = new Map([
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['node', 'nodejs'],
  ['nodejs', 'nodejs'],
  ['postgres', 'postgresql'],
  ['restapi', 'restapis'],
  ['restfulapi', 'restapis'],
  ['restfulapis', 'restapis'],
  ['oop', 'objectorientedprogramming'],
  ['sklearn', 'scikitlearn'],
  ['ml', 'machinelearning'],
]);

const priorityOrder = new Map([['high', 0], ['medium', 1], ['low', 2]]);

export function normalizeSkillName(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return skillAliases.get(normalized) ?? normalized;
}

function parseSkill(value) {
  const name = typeof value === 'string' ? value.trim() : value?.name;
  if (typeof name !== 'string' || !name.trim()) return null;

  const levelValue = typeof value === 'object' && value !== null
    ? (value.level ?? value.proficiency ?? value.strength)
    : null;
  const suffix = name.match(/\s*(?:\(|\[|[-:])\s*(novice|beginner|basic|entry|intermediate|moderate|proficient|advanced|expert)\s*[\])]?\s*$/i);
  const explicitLevel = typeof levelValue === 'string' ? levelValue.toLowerCase().trim() : suffix?.[1]?.toLowerCase();
  const cleanName = suffix ? name.slice(0, suffix.index).trim() : name.trim();

  return {
    name: cleanName,
    key: normalizeSkillName(cleanName),
    level: proficiencyLevels.get(explicitLevel) ?? null,
    levelName: explicitLevel ?? null,
  };
}

function getUserSkills(resume) {
  const parsed = resume?.parsed_data ?? {};
  const analysis = resume?.analysis_data ?? {};
  const values = [
    ...(Array.isArray(parsed.skills) ? parsed.skills : []),
    ...(Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : []),
    ...(Array.isArray(parsed.softSkills) ? parsed.softSkills : []),
    ...(Array.isArray(analysis.skills) ? analysis.skills : []),
    ...(Array.isArray(analysis.technicalSkills) ? analysis.technicalSkills : []),
    ...(Array.isArray(analysis.softSkills) ? analysis.softSkills : []),
  ];
  const skills = new Map();

  for (const value of values) {
    const skill = parseSkill(value);
    if (!skill) continue;
    const previous = skills.get(skill.key);
    if (!previous || (skill.level !== null && (previous.level === null || skill.level > previous.level))) {
      skills.set(skill.key, skill);
    }
  }

  return skills;
}

export function compareResumeSkills(resume, requirements) {
  const userSkills = getUserSkills(resume);
  const skills = requirements
    .map((requirement) => {
      const skillName = requirement.name ?? requirement.skills?.name;
      if (!skillName) return null;

      const userSkill = userSkills.get(normalizeSkillName(skillName));
      const requiredStrength = requirement.required_strength ?? 'intermediate';
      const requiredLevel = proficiencyLevels.get(requiredStrength.toLowerCase()) ?? 1;
      const isBelowTarget = userSkill?.level !== null
        && userSkill?.level !== undefined
        && userSkill.level < requiredLevel;
      const status = !userSkill ? 'missing' : (isBelowTarget ? 'needs-improvement' : 'match');

      return {
        name: skillName,
        status,
        userStrength: userSkill?.levelName ?? (userSkill ? 'Listed' : null),
        requiredStrength,
        priority: requirement.priority ?? 'medium',
        learningArea: requirement.learning_area ?? null,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (
      (priorityOrder.get(left.priority) ?? 3) - (priorityOrder.get(right.priority) ?? 3)
      || left.name.localeCompare(right.name)
    ));

  const matchingSkills = skills.filter((skill) => skill.status === 'match');
  const missingSkills = skills.filter((skill) => skill.status === 'missing');
  const skillsNeedingImprovement = skills.filter((skill) => skill.status === 'needs-improvement');
  const learningSkills = [...missingSkills, ...skillsNeedingImprovement]
    .filter((skill) => skill.learningArea)
    .sort((left, right) => (priorityOrder.get(left.priority) ?? 3) - (priorityOrder.get(right.priority) ?? 3));

  return {
    skills,
    matchingSkills,
    missingSkills,
    skillsNeedingImprovement,
    recommendedLearningAreas: learningSkills.map(({ name, status, priority, learningArea }) => ({
      skill: name,
      status,
      priority,
      area: learningArea,
    })),
    summary: {
      totalRequired: skills.length,
      matched: matchingSkills.length,
      needsImprovement: skillsNeedingImprovement.length,
      missing: missingSkills.length,
      matchPercent: skills.length ? Math.round((matchingSkills.length / skills.length) * 100) : 0,
    },
  };
}