import test from 'node:test';
import assert from 'node:assert/strict';
import { compareResumeSkills } from './skillGapAnalyzer.js';

test('matches aliases and reports missing skills with stored priorities', () => {
  const result = compareResumeSkills({ parsed_data: { skills: ['JavaScript', 'REST APIs'] } }, [
    { name: 'JS', required_strength: 'intermediate', priority: 'medium' },
    { name: 'Docker', required_strength: 'intermediate', priority: 'high', learning_area: 'Container fundamentals' },
  ]);

  assert.equal(result.matchingSkills[0].name, 'JS');
  assert.equal(result.missingSkills[0].name, 'Docker');
  assert.equal(result.missingSkills[0].priority, 'high');
  assert.deepEqual(result.recommendedLearningAreas[0], {
    skill: 'Docker',
    status: 'missing',
    priority: 'high',
    area: 'Container fundamentals',
  });
});

test('marks an explicitly under-level skill as needing improvement', () => {
  const result = compareResumeSkills({ parsed_data: { skills: ['Python (beginner)'] } }, [
    { name: 'Python', required_strength: 'intermediate', priority: 'high', learning_area: 'Python application design' },
  ]);

  assert.equal(result.skillsNeedingImprovement[0].userStrength, 'beginner');
  assert.equal(result.skillsNeedingImprovement[0].requiredStrength, 'intermediate');
  assert.equal(result.summary.matchPercent, 0);
});

test('uses parsed and analyzed resume skills without inventing proficiency', () => {
  const result = compareResumeSkills({
    parsed_data: { skills: [] },
    analysis_data: { technicalSkills: ['SQL'] },
  }, [
    { name: 'SQL', required_strength: 'advanced', priority: 'high' },
  ]);

  assert.equal(result.matchingSkills[0].userStrength, 'Listed');
  assert.equal(result.skillsNeedingImprovement.length, 0);
});