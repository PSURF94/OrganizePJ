-- Migration v3: goals and goal_contributions
CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  accumulated_amount numeric NOT NULL DEFAULT 0,
  percentage_allocation numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  receivable_id uuid REFERENCES receivables(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  note text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_goals" ON goals FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE POLICY "users_own_goal_contributions" ON goal_contributions FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- Saldo inicial em conta (dinheiro antes de começar a usar o app)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS saldo_inicial numeric DEFAULT 0;
