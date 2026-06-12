-- v8: dedup do email de trial + rastreio de pagamento via link (S6.8 + S4 UI)

-- S6.8: evita envio duplicado do email D-1 se o cron rodar mais de uma vez no dia
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMPTZ;

-- S4 UI: sinaliza que o recebível foi baixado automaticamente pelo webhook Asaas
--        (distingue de "marcar recebido" manual para o indicador na tela de Receitas)
ALTER TABLE receivables
  ADD COLUMN IF NOT EXISTS paid_via_link BOOLEAN DEFAULT FALSE;
