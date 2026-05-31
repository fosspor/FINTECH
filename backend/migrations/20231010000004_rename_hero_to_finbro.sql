ALTER TABLE hero_profiles
ALTER COLUMN name SET DEFAULT 'ФИНБРО';

UPDATE hero_profiles
SET name = 'ФИНБРО'
WHERE name IN ('FinBro', 'FinClip', 'FILCLICK');
