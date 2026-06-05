-- v4: Installments on receivables
ALTER TABLE receivables
ADD COLUMN IF NOT EXISTS installment_group_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installment_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_total INTEGER NOT NULL DEFAULT 1;
