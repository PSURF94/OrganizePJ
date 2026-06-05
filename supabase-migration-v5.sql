-- v5: Pro-labore and withdrawal planning
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS prolabore_mensal DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retirada_desejada_mensal DECIMAL(12,2) DEFAULT NULL;
