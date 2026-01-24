INSERT INTO site_settings (key, value, type, description) VALUES
  ('about_value_1_icon', 'Heart', 'text', '핵심 가치 1 아이콘'),
  ('about_value_2_icon', 'Target', 'text', '핵심 가치 2 아이콘'),
  ('about_value_3_icon', 'Eye', 'text', '핵심 가치 3 아이콘'),
  ('about_value_4_icon', 'CheckCircle', 'text', '핵심 가치 4 아이콘')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
