import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCareerRecommendations } from './careerRecommendationService.js';

const roles = [
  {
    id: 'backend',
    title: 'Backend Developer',
    description: 'Build APIs and backend services.',
    requirements: [
      { name: 'Node.js', required_strength: 'intermediate', priority: 'high', learning_area: 'Node services' },
      { name: 'REST APIs', required_strength: 'intermediate', priority: 'high', learning_area: 'API design' },
      { name: 'SQL', required_strength: 'intermediate', priority: 'medium', learning_area: 'Relational data' },
      { name: 'Docker', required_strength: 'intermediate', priority: 'medium', learning_area: 'Containers' },
    ],
  },
  {
    id: 'analyst',
    title: 'Data Analyst',
    description: 'Analyze and communicate data insights.',
    requirements: [
      { name: 'SQL', required_strength: 'intermediate', priority: 'high', learning_area: 'Analytical SQL' },
      { name: 'Python', required_strength: 'intermediate', priority: 'high', learning_area: 'Data analysis with Python' },
      { name: 'Excel', required_strength: 'intermediate', priority: 'medium', learning_area: 'Spreadsheet analysis' },
      { name: 'Power BI', required_strength: 'intermediate', priority: 'medium', learning_area: 'BI reporting' },
    ],
  },
];

test('ranks a backend-oriented resume from skills and project evidence', () => {
  const recommendations = buildCareerRecommendations({
    parsed_data: {
      skills: ['Node.js', 'REST APIs', 'SQL'],
      projects: ['Built a Docker service for a course project.'],
      education: ['Computer Science'],
    },
  }, roles);

  assert.equal(recommendations[0].role.id, 'backend');
  assert.equal(recommendations[0].skillMatchPercent, 100);
  assert.ok(recommendations[0].evidence.skillMentions.some((item) => item.skill === 'Docker' && item.section === 'Projects'));
  assert.match(recommendations[0].explanation, /not a guaranteed career outcome/);
});

test('ranks a data-oriented profile using skills, experience, and declared interests', () => {
  const recommendations = buildCareerRecommendations({
    parsed_data: {
      skills: ['SQL', 'Python', 'Excel', 'Power BI'],
      education: ['Statistics and data analysis'],
      projects: ['Created a Power BI dashboard for sales data.'],
      experience: ['Prepared Python reports for an analytics team.'],
      target_interests: ['Data Analyst'],
    },
  }, roles);

  assert.equal(recommendations[0].role.id, 'analyst');
  assert.equal(recommendations[0].skillMatchPercent, 100);
  assert.equal(recommendations[0].evidence.interestMatch, true);
});

test('returns exploratory role guidance for a resume with no listed skills', () => {
  const recommendations = buildCareerRecommendations({ parsed_data: { education: ['Business studies'] } }, roles);

  assert.equal(recommendations.length, 2);
  assert.ok(recommendations.every((recommendation) => recommendation.missingSkills.length > 0));
  assert.ok(recommendations.every((recommendation) => recommendation.suggestedPreparationAreas.length > 0));
});