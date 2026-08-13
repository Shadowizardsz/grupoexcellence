[README.md](https://github.com/user-attachments/files/31030112/README.md)
# Kanban Grupo Excellence — Protótipo

## O que este arquivo é

`kanban-excellence.jsx` é um **protótipo funcional completo** do sistema descrito no prompt: Kanban com 3 colunas, drag-and-drop, cards de tarefa, modal de criação/edição, filtros, busca, Dashboard com indicadores e gráficos, tarefas atrasadas, próximos prazos, responsividade mobile e a identidade visual preto/dourado do Grupo Excellence.

Ele roda como artifact no Claude e usa o armazenamento compartilhado do próprio Claude (`window.storage`) para persistir as tarefas entre os membros da equipe — por isso já é utilizável agora, sem infraestrutura própria, para testar o fluxo completo com a equipe.

**Login:** como este ambiente não pode se conectar a um banco de autenticação real, o login é feito selecionando o nome do usuário (Ruy, Karol, Bruna, Isael, Nélio) em vez de e-mail/senha.

**Logo:** o prompt menciona uma logo em anexo, mas nenhum arquivo de imagem chegou até mim nesta conversa — usei por enquanto um monograma "GE" no cabeçalho e na tela de login. Envie o arquivo da logo (PNG/SVG) que eu substituo.

## Para virar o sistema de produção (Vercel + Supabase)

O protótipo já define toda a lógica de negócio (status, prioridades, categorias, cálculos do dashboard, regras de atraso). Para transformar em uma aplicação real, multiusuário, com autenticação e banco PostgreSQL, os passos são:

### 1. Criar o projeto Supabase
- Crie um projeto em supabase.com
- Em **SQL Editor**, crie as tabelas:

```sql
create table users (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  email text not null,
  avatar text,
  funcao text default 'colaborador', -- 'administrador' | 'colaborador'
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo',       -- todo | doing | done
  priority text not null default 'media',     -- alta | media | baixa
  category text not null,
  responsible_user_id uuid references users(id),
  created_by uuid references users(id),
  due_date date,
  completed_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table users enable row level security;
alter table tasks enable row level security;
-- políticas de RLS: liberar select/insert/update para usuários autenticados,
-- e restringir delete/edição de tarefas de terceiros ao perfil administrador.
```

- Ative **Supabase Auth** (e-mail/senha) e crie o primeiro administrador manualmente pelo painel Authentication → depois insira a linha correspondente em `users` com `funcao = 'administrador'`.

### 2. Variáveis de ambiente
Crie um projeto Next.js + TypeScript + Tailwind e adicione um `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Portar o protótipo
A UI e a lógica de `kanban-excellence.jsx` podem ser reaproveitadas quase integralmente:
- troque `TEAM` (array fixo) por uma query em `users`
- troque `useTasks()` (que hoje usa `window.storage`) por chamadas ao client do Supabase (`select`, `insert`, `update`, `delete` em `tasks`) e, idealmente, `supabase.channel(...).on('postgres_changes', ...)` para sincronizar em tempo real entre usuários
- adicione a tela de login com `supabase.auth.signInWithPassword`
- adicione o Drag and Drop com uma lib como `@dnd-kit/core` (o protótipo usa HTML5 DnD nativo, que também funciona em produção)

### 4. Rodar localmente
```
npm install
npm run dev
```

### 5. Publicar na Vercel
- Suba o projeto num repositório Git
- Importe o repositório na Vercel
- Adicione as mesmas variáveis de ambiente do passo 2 nas configurações do projeto na Vercel
- Deploy

---

Posso gerar o esqueleto completo do projeto Next.js + Supabase (páginas, client do Supabase, queries, RLS) se você quiser seguir esse caminho — é só pedir.
