-- Organize PJ — Schema completo

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  cnpj text,
  tax_regime text not null default 'simples',
  simples_rate numeric not null default 6,
  trial_ends_at timestamptz not null,
  license_expires_at timestamptz,
  status text not null default 'trial',
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  name text not null,
  cpf_cnpj text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  description text,
  contracted_value numeric not null default 0,
  execution_date date,
  expected_payment_date date,
  status text not null default 'orcamento',
  created_at timestamptz default now()
);

create table receivables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  description text not null,
  amount numeric not null,
  due_date date not null,
  received_date date,
  status text not null default 'pendente',
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  category text not null,
  description text not null default '',
  amount numeric not null,
  date date not null,
  installment_group_id uuid,
  installment_number int not null default 1,
  installment_total int not null default 1,
  created_at timestamptz default now()
);

-- RLS
alter table companies enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table receivables enable row level security;
alter table expenses enable row level security;

-- Policies: companies
create policy "owner access" on companies
  for all using (owner_id = auth.uid());

-- Policies: clients (via company)
create policy "company access" on clients
  for all using (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- Policies: services
create policy "company access" on services
  for all using (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- Policies: receivables
create policy "company access" on receivables
  for all using (
    company_id in (select id from companies where owner_id = auth.uid())
  );

-- Policies: expenses
create policy "company access" on expenses
  for all using (
    company_id in (select id from companies where owner_id = auth.uid())
  );
