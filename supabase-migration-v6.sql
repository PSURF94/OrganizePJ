-- v6: plan column to track Basic vs Pro per company
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'basic';
