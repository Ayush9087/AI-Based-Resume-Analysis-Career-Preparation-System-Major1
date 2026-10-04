alter table public.career_role_skills
add column if not exists priority text not null default 'medium',
add column if not exists learning_area text;

insert into public.skills (name, category, description) values
  ('JavaScript', 'technical', 'Programming language used for web and server applications.'),
  ('TypeScript', 'technical', 'Typed JavaScript for maintainable application development.'),
  ('Java', 'technical', 'Object-oriented language used for application and backend development.'),
  ('Python', 'technical', 'General-purpose language used for web, automation, data, and AI.'),
  ('SQL', 'technical', 'Querying and transforming relational data.'),
  ('PostgreSQL', 'technical', 'Relational database design, querying, and administration.'),
  ('Git', 'technical', 'Version control and collaborative development workflows.'),
  ('REST APIs', 'technical', 'Designing and consuming HTTP APIs.'),
  ('Object-Oriented Programming', 'technical', 'Applying classes, composition, and core OOP principles.'),
  ('Automated Testing', 'technical', 'Writing reliable unit and integration tests.'),
  ('Docker', 'technical', 'Building and operating containerized applications.'),
  ('Authentication', 'technical', 'Identity, authorization, and secure session handling.'),
  ('Node.js', 'technical', 'Server-side JavaScript runtime and backend development.'),
  ('Django', 'technical', 'Building Python web applications with Django.'),
  ('pytest', 'technical', 'Testing Python applications with pytest.'),
  ('Excel', 'technical', 'Spreadsheet analysis, formulas, and data preparation.'),
  ('Power BI', 'technical', 'Building data models, reports, and dashboards in Power BI.'),
  ('Tableau', 'technical', 'Creating interactive data visualizations in Tableau.'),
  ('Data Visualization', 'technical', 'Communicating patterns with accurate visual encodings.'),
  ('Statistics', 'technical', 'Statistical reasoning, inference, and experimental analysis.'),
  ('Pandas', 'technical', 'Data cleaning and analysis with the Pandas library.'),
  ('Scikit-learn', 'technical', 'Building and evaluating classical machine-learning models.'),
  ('Machine Learning', 'technical', 'Training, evaluating, and applying machine-learning models.'),
  ('Deep Learning', 'technical', 'Neural network fundamentals and model training.'),
  ('TensorFlow', 'technical', 'Developing and deploying models with TensorFlow.'),
  ('PyTorch', 'technical', 'Developing and training models with PyTorch.'),
  ('MLOps', 'technical', 'Testing, deploying, monitoring, and maintaining ML systems.'),
  ('LLMs', 'technical', 'Integrating and evaluating large language models.'),
  ('Prompt Engineering', 'technical', 'Designing and testing reliable instructions for language models.'),
  ('API Integration', 'technical', 'Connecting services through stable, secure API contracts.'),
  ('Model Evaluation', 'technical', 'Measuring model quality, robustness, and regression.'),
  ('Communication', 'soft', 'Explaining technical work clearly to different audiences.')
on conflict (name) do update
set category = excluded.category, description = excluded.description;

insert into public.career_roles (title, description) values
  ('Software Developer', 'Build, test, and maintain software applications.'),
  ('Python Developer', 'Develop Python applications, services, and automation.'),
  ('Backend Developer', 'Build secure APIs, data services, and backend systems.'),
  ('Data Analyst', 'Query, interpret, and communicate insights from data.'),
  ('Data Scientist', 'Use statistics and machine learning to solve data problems.'),
  ('Machine Learning Engineer', 'Develop and operate production machine-learning systems.'),
  ('AI Engineer', 'Build product features and services powered by AI models.')
on conflict (title) do update
set description = excluded.description;

insert into public.career_role_skills (role_id, skill_id, required_strength, priority, learning_area)
select roles.id, skills.id, requirements.required_strength, requirements.priority, requirements.learning_area
from (values
  ('Software Developer', 'JavaScript', 'intermediate', 'high', 'Language fundamentals, asynchronous code, and application structure'),
  ('Software Developer', 'Git', 'intermediate', 'high', 'Branching, code review, and collaborative version control'),
  ('Software Developer', 'SQL', 'intermediate', 'high', 'Relational queries, joins, and data modeling'),
  ('Software Developer', 'REST APIs', 'intermediate', 'high', 'HTTP methods, resource design, and API error handling'),
  ('Software Developer', 'Object-Oriented Programming', 'intermediate', 'medium', 'Composition, interfaces, and maintainable design'),
  ('Software Developer', 'Automated Testing', 'intermediate', 'high', 'Unit and integration testing strategies'),
  ('Software Developer', 'Communication', 'intermediate', 'medium', 'Technical writing, collaboration, and project communication'),
  ('Python Developer', 'Python', 'advanced', 'high', 'Python language features, packaging, and application design'),
  ('Python Developer', 'SQL', 'intermediate', 'high', 'Relational queries and database integration'),
  ('Python Developer', 'Git', 'intermediate', 'medium', 'Branching and collaborative version control'),
  ('Python Developer', 'REST APIs', 'intermediate', 'high', 'API design, validation, and HTTP behavior'),
  ('Python Developer', 'pytest', 'intermediate', 'medium', 'Fixtures, parametrization, and test isolation'),
  ('Python Developer', 'Django', 'intermediate', 'medium', 'Django models, views, authentication, and deployment'),
  ('Python Developer', 'Object-Oriented Programming', 'intermediate', 'medium', 'Classes, composition, and Python design patterns'),
  ('Backend Developer', 'Node.js', 'advanced', 'high', 'Asynchronous runtime behavior and service architecture'),
  ('Backend Developer', 'REST APIs', 'advanced', 'high', 'API contracts, validation, pagination, and error handling'),
  ('Backend Developer', 'SQL', 'intermediate', 'high', 'Relational data modeling, joins, and query performance'),
  ('Backend Developer', 'PostgreSQL', 'intermediate', 'high', 'Indexes, constraints, transactions, and migrations'),
  ('Backend Developer', 'Authentication', 'intermediate', 'high', 'Authorization, token validation, and secure sessions'),
  ('Backend Developer', 'Docker', 'intermediate', 'medium', 'Container images, networking, and reproducible services'),
  ('Backend Developer', 'Git', 'intermediate', 'medium', 'Code review and collaborative development'),
  ('Backend Developer', 'Automated Testing', 'intermediate', 'high', 'API, integration, and database testing'),
  ('Data Analyst', 'SQL', 'advanced', 'high', 'Complex queries, aggregations, and analytical data modeling'),
  ('Data Analyst', 'Python', 'intermediate', 'high', 'Data preparation and analysis scripting'),
  ('Data Analyst', 'Excel', 'intermediate', 'high', 'Formulas, pivot tables, and data quality checks'),
  ('Data Analyst', 'Power BI', 'intermediate', 'high', 'Data modeling, DAX, and interactive reporting'),
  ('Data Analyst', 'Tableau', 'intermediate', 'medium', 'Dashboard design and interactive visual analysis'),
  ('Data Analyst', 'Data Visualization', 'intermediate', 'high', 'Chart selection and clear analytical storytelling'),
  ('Data Analyst', 'Statistics', 'intermediate', 'medium', 'Descriptive statistics, sampling, and uncertainty'),
  ('Data Analyst', 'Communication', 'intermediate', 'medium', 'Presenting findings and analytical recommendations'),
  ('Data Scientist', 'Python', 'advanced', 'high', 'Data science workflows and reproducible Python projects'),
  ('Data Scientist', 'SQL', 'intermediate', 'high', 'Data extraction, joins, and analytical queries'),
  ('Data Scientist', 'Statistics', 'advanced', 'high', 'Inference, experimental design, and uncertainty'),
  ('Data Scientist', 'Machine Learning', 'intermediate', 'high', 'Feature design, training, and model evaluation'),
  ('Data Scientist', 'Pandas', 'advanced', 'high', 'Data cleaning, transformation, and analysis'),
  ('Data Scientist', 'Scikit-learn', 'intermediate', 'medium', 'Pipelines, validation, and classical ML models'),
  ('Data Scientist', 'Data Visualization', 'intermediate', 'medium', 'Exploratory analysis and communicating evidence'),
  ('Machine Learning Engineer', 'Python', 'advanced', 'high', 'Production Python, packaging, and service integration'),
  ('Machine Learning Engineer', 'Machine Learning', 'advanced', 'high', 'Model training, evaluation, and deployment trade-offs'),
  ('Machine Learning Engineer', 'Deep Learning', 'intermediate', 'high', 'Neural network training and inference fundamentals'),
  ('Machine Learning Engineer', 'TensorFlow', 'intermediate', 'medium', 'Training, exporting, and serving TensorFlow models'),
  ('Machine Learning Engineer', 'PyTorch', 'intermediate', 'medium', 'Training loops, model artifacts, and inference'),
  ('Machine Learning Engineer', 'Docker', 'intermediate', 'medium', 'Containerizing and deploying model services'),
  ('Machine Learning Engineer', 'SQL', 'intermediate', 'medium', 'Training-data queries and feature data storage'),
  ('Machine Learning Engineer', 'MLOps', 'intermediate', 'high', 'Model versioning, monitoring, and reproducible pipelines'),
  ('AI Engineer', 'Python', 'advanced', 'high', 'Python services and reliable AI application structure'),
  ('AI Engineer', 'Machine Learning', 'intermediate', 'medium', 'Model behavior, evaluation, and capability limits'),
  ('AI Engineer', 'LLMs', 'intermediate', 'high', 'LLM integration, retrieval patterns, and evaluation'),
  ('AI Engineer', 'Prompt Engineering', 'intermediate', 'medium', 'Structured prompting and prompt regression tests'),
  ('AI Engineer', 'API Integration', 'advanced', 'high', 'Reliable model API integration, retries, and validation'),
  ('AI Engineer', 'Docker', 'intermediate', 'medium', 'Deploying isolated and reproducible AI services'),
  ('AI Engineer', 'Git', 'intermediate', 'medium', 'Code review and versioned prompt/model changes'),
  ('AI Engineer', 'Model Evaluation', 'intermediate', 'high', 'Quality, safety, and regression evaluation for AI outputs')
) as requirements(role_title, skill_name, required_strength, priority, learning_area)
join public.career_roles roles on roles.title = requirements.role_title
join public.skills skills on skills.name = requirements.skill_name
on conflict (role_id, skill_id) do update
set required_strength = excluded.required_strength,
    priority = excluded.priority,
    learning_area = excluded.learning_area;