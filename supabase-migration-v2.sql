-- Migration v2: diagnostic fields for companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS profissao text,
  ADD COLUMN IF NOT EXISTS tem_funcionarios boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS num_funcionarios integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faturamento_mensal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faturamento_esperado_12m numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emite_nf boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_contador boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS controle_atual text,
  ADD COLUMN IF NOT EXISTS diagnostico_feito boolean DEFAULT false;
