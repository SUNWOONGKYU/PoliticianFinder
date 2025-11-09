-- P2D4: Politician Seed Data

INSERT INTO political_parties (name, abbreviation, color_code, description) VALUES
  ('Democratic Party', 'DPK', '#C60C30', 'Democratic Party of Korea'),
  ('People Power Party', 'PPP', '#003478', 'People Power Party'),
  ('Justice Party', 'JP', '#E81B23', 'Justice Party'),
  ('Democratic People Party', 'DPP', '#FFB800', 'Democratic People Party'),
  ('Green Party', 'GP', '#00AA00', 'Green Party'),
  ('Independent', 'IND', '#808080', 'Independent Politicians'),
  ('Future Korea Party', 'FKP', '#0051BA', 'Future Korea Party'),
  ('New Reform Party', 'NRP', '#FF6B35', 'New Reform Party'),
  ('Solidarity Party', 'SP', '#9B59B6', 'Solidarity Party'),
  ('Progress Coalition', 'PC', '#E74C3C', 'Progress Coalition')
ON CONFLICT (name) DO NOTHING;

INSERT INTO positions (name, abbreviation, level, description) VALUES
  ('National Assembly Member', 'NA', 'national', 'Member of the National Assembly'),
  ('Mayor', 'MAYOR', 'metropolitan', 'Metropolitan City Governor'),
  ('Metropolitan Council Member', 'MC', 'metropolitan', 'Member of Metropolitan Council'),
  ('District Chief', 'DC', 'local', 'District Chief Executive'),
  ('Local Council Member', 'LC', 'local', 'Member of Local Council'),
  ('Supervisor', 'SUP', 'local', 'Local Supervisory Position')
ON CONFLICT (name) DO NOTHING;

INSERT INTO constituencies (region, district, level, population) VALUES
  ('Seoul', 'Gangnam-gu A', 'national', 450000),
  ('Seoul', 'Gangnam-gu B', 'national', 430000),
  ('Seoul', 'Songpa-gu', 'national', 470000),
  ('Busan', 'Haeundae-gu A', 'national', 380000),
  ('Busan', 'Haeundae-gu B', 'national', 360000),
  ('Daegu', 'Jung-gu', 'local', 220000),
  ('Incheon', 'Namdong-gu', 'national', 320000),
  ('Gwangju', 'Gwangju Metropolitan', 'metropolitan', 1450000),
  ('Daejeon', 'Seo-gu', 'local', 280000),
  ('Ulsan', 'Buk-gu', 'national', 310000),
  ('Gyeonggi', 'Seongnam-si', 'national', 980000),
  ('Gyeonggi', 'Suwon-si', 'national', 1190000),
  ('Gyeongbuk', 'Pohang-si', 'local', 170000),
  ('Gyeongnam', 'Changwon-si', 'local', 1090000),
  ('Jeollanam', 'Gwangju', 'metropolitan', 1450000),
  ('Jeollabuk', 'Jeonju-si', 'local', 630000),
  ('Jeju', 'Jeju-si', 'metropolitan', 180000)
ON CONFLICT (region, district) DO NOTHING;

-- Sample politicians
INSERT INTO politicians (
  name, name_english, birth_date, gender, political_party_id, position_id, 
  constituency_id, email, bio, verified_at, is_active
) 
SELECT
  'Kim Min-jun', 'Kim Min-jun', '1975-03-15'::date, 'M',
  (SELECT id FROM political_parties WHERE name = 'Democratic Party' LIMIT 1),
  (SELECT id FROM positions WHERE name = 'National Assembly Member' LIMIT 1),
  (SELECT id FROM constituencies WHERE region = 'Seoul' AND district = 'Gangnam-gu A' LIMIT 1),
  'kim@example.com', 'Economic policy specialist',
  NOW(), true
ON CONFLICT DO NOTHING;

INSERT INTO politicians (
  name, name_english, birth_date, gender, political_party_id, position_id, 
  constituency_id, email, bio, verified_at, is_active
) 
SELECT
  'Lee Seo-yeon', 'Lee Seo-yeon', '1972-07-22'::date, 'F',
  (SELECT id FROM political_parties WHERE name = 'People Power Party' LIMIT 1),
  (SELECT id FROM positions WHERE name = 'National Assembly Member' LIMIT 1),
  (SELECT id FROM constituencies WHERE region = 'Busan' AND district = 'Haeundae-gu A' LIMIT 1),
  'lee@example.com', 'Education and women rights advocate',
  NOW(), true
ON CONFLICT DO NOTHING;

INSERT INTO politicians (
  name, name_english, birth_date, gender, political_party_id, position_id, 
  constituency_id, email, bio, verified_at, is_active
) 
SELECT
  'Park Ji-hu', 'Park Ji-hu', '1968-11-03'::date, 'M',
  (SELECT id FROM political_parties WHERE name = 'Justice Party' LIMIT 1),
  (SELECT id FROM positions WHERE name = 'Metropolitan Council Member' LIMIT 1),
  (SELECT id FROM constituencies WHERE region = 'Seoul' AND district = 'Songpa-gu' LIMIT 1),
  'park@example.com', 'Environmental advocate',
  NOW(), true
ON CONFLICT DO NOTHING;
