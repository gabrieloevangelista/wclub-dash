# Documento de Requisitos do Produto (PRD) - WHITECLUB 

> **Variáveis do Documento**
>
> | Variável | Descrição |
> |---|---|
> | `{{PLATFORM_NAME}}` | WHITECLUB (Minha Comunidade / Portal de Elite) |
> | `{{COMPANY_SHORT}}` | Grupo CLS / CLS Holding |

Este documento define o escopo completo, arquitetura, modelagem de dados, regras de negócio, requisitos funcionais e não funcionais da plataforma **WHITECLUB**. A plataforma é um portal web exclusivo para mentores, mentorados e administradores para consumo de masterclasses, gestão de recursos de engenharia/negócios, acompanhamento de oportunidades de co-investimento, simulações de financiamento e interação comunitária.

---

## 1. Visão Geral do Produto
A **WHITECLUB** é uma plataforma web premium de educação corporativa, engenharia e networking, projetada com estética ultramoderna (modo escuro profundo com efeitos glassmorphism, desfoque de fundo e detalhes em dourado metálico). Ela centraliza a entrega de conteúdos educativos de alto nível (Masterclasses), distribuição de recursos de apoio, anúncios de oportunidades de investimento, simulador financeiro de obras, calendário de eventos interativo, portal de missões práticas e controle administrativo robusto em uma interface responsiva, otimizada para desktops, tablets e smartphones.

---

## 2. Arquitetura do Sistema & Stack Tecnológica
*   **Framework:** Next.js (App Router) utilizando componentes de servidor (RSC) para renderização eficiente de dados dinâmicos e componentes de cliente (Client Components) para interações rápidas.
*   **Banco de Dados & Autenticação:** Supabase (PostgreSQL) com suporte a Row Level Security (RLS) e autenticação baseada em JSON Web Tokens (JWT).
*   **Estilização:** CSS Vanilla com variáveis customizadas (CSS Variables) para definição do sistema de design (design tokens), suportando alternância de temas e efeitos visuais modernos.
*   **Gerenciador de Pacotes:** `pnpm` (uso obrigatório conforme regras globais).
*   **Pipeline de Compilação:** O build de produção é gerado automaticamente após o commit no servidor de CI/CD (Vercel). Nenhuma compilação ou build local deve ser gerada pré-commit.

---

## 3. Perfis de Usuário (Regras de Acesso)
O controle de acesso é baseado na coluna `member_type` associada a cada usuário autenticado na tabela `public.members`.

1.  **Administrador (Admin):**
    *   Controle total da plataforma.
    *   Gerenciamento completo (criar, editar, reordenar e excluir) de Masterclasses, Módulos, Aulas e Recursos.
    *   Controle de membros (editar papéis, criar usuários manuais com disparo de e-mail de redefinição de senha e excluir contas em lote).
    *   Agendamento de liberação temporal de aulas e recursos.
    *   Criação, edição e exclusão de eventos no calendário.
    *   Gerenciamento e publicação de Missões Técnicas, além da avaliação de entregas dos alunos.
    *   Acesso exclusivo às páginas de **Oportunidades de Investimento** e **Projetos para Financiamento**.
    *   Gerenciamento de banners do Ecossistema.
2.  **Mentor (Master):**
    *   Acesso prioritário a masterclasses, aulas publicadas e recursos liberados.
    *   Visualização de eventos no calendário e sincronização com Google Calendar.
    *   Criação e exclusão de eventos rápidos no calendário.
    *   Acesso ao feed da comunidade: pode postar (padrão, status, reels), curtir, comentar e interagir.
3.  **Mentorado (Mentor / Membro Comum):**
    *   Acesso de leitura ao conteúdo publicado (Masterclasses e Aulas).
    *   Acesso de leitura e download aos recursos disponíveis e liberados.
    *   Execução e envio de Missões Técnicas (textos, links ou uploads de até 100MB).
    *   Acesso ao feed da comunidade: pode postar, curtir, comentar, salvar posts e gerenciar conexões.
    *   **Restrição Temporal:** Não visualiza nem acessa recursos ou aulas agendadas para datas futuras.
    *   Não possui acesso às rotas administrativas, oportunidades ou projetos.
4.  **Controle de Inatividade e Bloqueios:**
    *   Qualquer usuário autenticado cujo status na tabela `members` seja diferente de `'Ativo'` é bloqueado e redirecionado para a página `/sem-permissao`.
    *   Usuários ativos que tentarem acessar rotas restritas (/oportunidades, /projetos, /admin/*) são redirecionados à tela de `/sem-permissao` informando restrição exclusiva a administradores.

---

## 4. Requisitos Funcionais

### 4.1. Gestão de Conteúdo (Masterclasses & Aulas)
*   **Hierarquia de Conteúdo:** Estrutura em três níveis: **Courses (Masterclasses)** ➔ **Modules (Módulos)** ➔ **Lessons (Aulas)**.
*   **Rotas Amigáveis (Friendly URLs):**
    *   Acesso aos cursos por slugs semânticos em vez de IDs UUIDs diretos (ex: `/masterclasses/curso/nome-da-masterclass`).
    *   Acesso direto a aulas via slug simplificado (ex: `/masterclasses/aula/slug-da-aula`).
*   **Painel Administrativo de Reordenação:**
    *   **Drag-and-Drop (Arrastar e Soltar):** Permite reordenar módulos verticalmente dentro de um curso.
    *   **Reordenação de Aulas:** Permite reordenar aulas dentro do mesmo módulo ou mover aulas entre módulos diferentes.
    *   **Resolução de Conflitos Físicos:** Durante o arrasto de aulas, o navegador desabilita temporariamente o arrasto do módulo correspondente para evitar interceptações e conflitos de eventos.
*   **Renomeação Inline:** Clique duplo diretamente sobre o título de um módulo ou aula no painel administrativo permite editá-lo textualmente ali mesmo, sem abertura de modais.
*   **Controle de Status e Disponibilidade:**
    *   Aulas e módulos possuem status: `rascunho`, `publicado` ou `agendado`.
    *   Aulas com status `agendado` exigem uma data/hora futura (`scheduled_at`). São invisíveis para membros comuns até o prazo de liberação.

### 4.2. Central de Recursos (Arquivos e Documentos)
*   **Upload Automático e Categoria:**
    *   O administrador realiza o envio de arquivos (planilhas, PDFs, apresentações).
    *   O sistema identifica automaticamente a extensão do arquivo e o categoriza na interface.
*   **Categorização Automática de Extensões:**
    *   `.xls`, `.xlsx`, `.csv` ➔ Mapeado para `spreadsheet` (Planilha).
    *   `.pdf`, `.doc`, `.docx`, `.txt` ➔ Mapeado para `document` (Documento).
    *   `.ppt`, `.pptx` ➔ Mapeado para `presentation` (Apresentação).
    *   Outras extensões ➔ Mapeadas para `other` (Outros).
*   **Download Inteligente:**
    *   Se a aula possuir apenas **1 recurso** associado, o clique em "Baixar recursos" realiza o download direto do arquivo.
    *   Se possuir **múltiplos recursos**, o sistema compila os arquivos no lado do cliente em um arquivo `.zip` (usando a biblioteca `JSZip`) e realiza o download do pacote unificado, economizando processamento no servidor.
*   **Agendamento de Recursos:** Administradores podem definir uma data e hora futura (`available_at`) para a liberação de recursos específicos. Membros não-admin não enxergam materiais agendados antes do prazo.
*   **Ações em Massa (Bulk Actions):** Seleção múltipla de arquivos no painel para exclusão em lote ou alteração de visibilidade no painel administrativo.

### 4.3. Calendário de Eventos (Mentoria & Atualização)
*   **Visualização Multimodo:** Permite alternar entre exibição em **Grade de Calendário** (mensal) e **Lista** cronológica de eventos.
*   **Tipos de Evento:**
    *   `mentoria`: Reuniões interativas com mentores.
    *   `atualizacao`: Reuniões de portfólio, atualizações de obras ou investimentos.
*   **Filtros Rápidos:** Filtragem de visualização por tipo de evento (`todos`, `mentoria`, `atualizacao`).
*   **Componente de Calendário Customizado:** DateTimePicker moderno com seleção de datas, horas e suporte a fuso horário local (`America/Sao_Paulo`).
*   **Integração com Google Calendar:**
    *   Geração automática de link "Adicionar à Agenda Google" com parâmetros formatados (título, data/hora inicial e final, descrição com pauta, link do Zoom/Meet e fuso horário).
    *   Opção de autenticação/vinculação simulada de conta Google para sincronização de eventos com aviso em Toast.
*   **Gestão de Eventos (Administrador & Mentores):**
    *   Acesso a formulário modal para criar novos eventos diretamente clicando nos dias do calendário.
    *   Permissão para excluir eventos agendados com modal de confirmação customizado.
*   **Notificações Globais:** A criação de um novo evento pelo administrador insere automaticamente uma notificação global na tabela `notifications` (com `user_id` nulo).

### 4.4. Comunidade e Feed Interativo
*   **Feed de Publicações:** Compartilhamento de atualizações, artigos e dúvidas no feed.
*   **Tipos de Post:**
    *   `standard`: Publicações normais contendo texto e imagens.
    *   `status`: Publicações rápidas em formato de Stories que expiram e são removidas da exibição pública após 24 horas.
    *   `reels`: Vídeos curtos focados em visualização rápida.
*   **Mídias nos Posts:** Suporte a links de imagens, vídeos e player de vídeo dedicado com upload direto.
*   **Interações de Engajamento:**
    *   Curtidas (likes) com armazenamento do ID do usuário para evitar curtidas duplicadas.
    *   Opção de salvar publicação no perfil do usuário (`saved_by_users`).
*   **Comentários e Respostas Aninhadas (Replies):**
    *   Comentários de posts comunitários com suporte a respostas em segundo nível de aninhamento.
    *   Edição e exclusão de comentários/respostas permitida ao autor do conteúdo ou ao administrador.
*   **Lightbox de Imagens:** Visualização ampliada de mídias de postagens com visualização integrada de comentários e lista de curtidas/avatares.

### 4.5. Oportunidades de Investimento (Admin-Only)
*   **Painel de Oportunidades:** Rota restrita `/oportunidades` para exibição de investimentos imobiliários, private equity ativos, infraestrutura e contechs.
*   **Métricas Chave:** Exibição clara da Taxa Interna de Retorno Estimada (Target IRR), Aporte Mínimo (Min Investment), categoria e status do financiamento/vagas.
*   **Pitch de Projetos:** Janela modal detalhada contendo a descrição completa, prazo estimado de retorno e termos contratuais.
*   **Manifestação de Interesse:** Botão para registro de interesse do administrador, disparando um fluxo simulado de contato comercial.

### 4.6. Projetos & Simulador de Financiamento (Admin-Only)
*   **Biblioteca de Projetos:** Rota restrita `/projetos` contendo plantas executivas de projetos de luxo, chalés alpines e micro-livings prontos para download em PDF.
*   **Simulador de Financiamento CLS:**
    *   Ajuste dinâmico de valor da obra, percentual de entrada (mínimo de 10% do valor da obra) e prazo de amortização (até 360 meses).
    *   Cálculo de parcelas automáticas baseado na Taxa Especial de Juros do Clube (**8.5% a.a.**) contra a Taxa de Mercado de Referência (**11.5% a.a.**).
    *   Exibição em tempo real da economia total estimada ao financiar pelo Clube.
    *   **Acionamento da Mesa de Crédito:** Botão "Falar com Gerente" que registra a simulação financeira e envia as informações para a equipe de gerenciamento de crédito.

### 4.7. Perfis, Conexões e Descoberta de Membros
*   **Perfil do Usuário:** Informações detalhadas de contato e carreira (Nome, Cargo, Empresa, Indústria, Localização, Bio, LinkedIn, Instagram, Website).
*   **Validação de Username:** Nomes de usuário devem conter apenas letras minúsculas, números, sublinhas (_) ou pontos (.). São validados no salvamento e possuem restrição de unicidade (Unique Constraint).
*   **Upload de Avatar:** Suporte a upload de arquivo de imagem de perfil com validação de tamanho máximo de **2MB**.
*   **Rede de Conexões:**
    *   Solicitação de conexão entre membros da plataforma.
    *   Estados de conexão: `pending` (enviado ou recebido), `accepted` (aceito) e `rejected` (rejeitado).
    *   Aba "Descobrir" (Discovery) para buscar outros membros não conectados no ecossistema e enviar solicitações de conexão direta.
    *   Opção de aceitar, recusar ou desfazer conexões diretamente pela interface de perfil ou feed de membros.

### 4.8. Fluxo de Autenticação & Cadastro Secreto de Mentorados
*   **Rota Oculta de Registro:** O cadastro de novos mentorados é feito exclusivamente pela URL secreta `/cadastro-mentorados`. Não existem links públicos para este formulário na tela de login ou na página inicial.
*   **Campos de Cadastro:** Nome Completo, E-mail, Senha e Confirmação de Senha.
*   **Criação Segura via API:**
    *   O formulário envia os dados para a API `/api/auth/register-mentorado`.
    *   A API usa a chave de serviço administrativa do Supabase (`createAdminClient`) para registrar o usuário no Supabase Auth com confirmação automática de e-mail (`email_confirm: true`).
    *   A API insere os dados do perfil na tabela pública `members`, definindo obrigatoriamente a coluna `member_type` como `mentor`.
    *   Iniciais do usuário são geradas automaticamente no servidor para fallback do avatar.
    *   Se a inserção na tabela `members` falhar, o usuário criado no Auth é deletado automaticamente para manter a integridade transacional.
*   **Auto-Login:** Após a criação bem-sucedida da conta, o cliente Next.js autentica o usuário automaticamente (`signInWithPassword`) e realiza o redirecionamento imediato para a rota `/dashboard`.
*   **Cadastro Público Desativado:** Rota `/cadastro` redireciona imediatamente para `/login` avisando que os registros públicos estão suspensos.

### 4.9. Ecossistema & Gestão de Banners
*   **Página do Ecossistema:**
    *   Exibe banners dinâmicos em formato de slide de destaque.
    *   Apresenta produtos digitais destacados, projetos de co-investimento e episódios de podcasts integrados.
*   **Painel Administrativo de Banners:**
    *   Rota restrita `/admin/ecossistema` que permite aos administradores visualizarem todos os banners cadastrados.
    *   **Ordenação Flexível:** Administradores podem subir ou descer a ordem dos slides por meio de setas direcionais, atualizando o campo `sequence_order` de forma paralela no banco de dados.
    *   **Gerenciamento CRUD:** Permite criar novos slides em `/admin/ecossistema/novo` e editar ou remover slides existentes.
    *   **Controle de Visibilidade:** Possibilidade de desativar um slide (campo `disabled`), impedindo sua exibição no ecossistema público sem a necessidade de excluí-lo.

### 4.10. Central de Missões & Entregas (Membros & Admin)
*   **Gestão de Missões (Administrador):**
    *   Criação, edição e exclusão de missões técnicas.
    *   Configuração flexível dos requisitos de resposta:
        *   `has_text_question`: Pergunta textual obrigatória.
        *   `has_form_link`: Link externo obrigatório (ex: Google Forms/Typeform).
        *   `has_file_upload`: Upload de arquivo obrigatório com rótulo personalizável.
*   **Submissão de Missões (Membro Mentorado):**
    *   Interface no formato acordeão para visualização de missões.
    *   Upload de arquivos de entrega de até **100MB** salvos no bucket público de storage `missions` através de endpoint seguro `/api/missions/upload`.
    *   Acompanhamento do progresso geral por meio de uma barra de progresso visual com base no percentual de missões concluídas/aprovadas.
*   **Painel de Avaliação (Administrador):**
    *   Visualização de todas as submissões dos mentorados organizadas cronologicamente na aba "Correções".
    *   Atribuição de status de revisão: `pending` (Pendente), `approved` (Aprovado/Concluído) ou `rejected` (Corrigir).
    *   Envio de feedback escrito personalizado associado ao status.
    *   Permissão para o mentorado reenviar uma nova versão da tarefa caso ela seja rejeitada/marcada para correção.

### 4.11. Dashboard & Onboarding Tutorial
*   **Saudação Dinâmica:** Painel de boas-vindas com primeiro nome e saudação horária inteligente ("Bom dia", "Boa tarde" ou "Boa noite").
*   **Tutorial de Onboarding:**
    *   Tour interativo de introdução composto por 6 etapas com posicionamento dinâmico baseado em elementos reais da tela (boas-vindas, barra de progresso, transmissões, agenda de eventos, atalhos de masterclasses e barra de navegação).
    *   Opção "Não mostrar novamente" que persiste o status no localStorage (`cls_skip_tutorial`) para impedir exibições repetitivas.
*   **Indicadores de Progresso de Treinamento:**
    *   Cálculo do percentual de conclusão de aulas assistidas dinamicamente do aluno no módulo ativo.
    *   Contagem de missões entregues e aprovadas.

---

## 5. Requisitos Não Funcionais

### 5.1. Estética, Design & Usabilidade (UI/UX)
*   **Visual Premium Gold/Glassmorphism:**
    *   Fundo escuro profundo (`#010105`).
    *   Bordas semitransparentes com efeito de desfoque de fundo (`backdrop-filter: blur(16px)`).
    *   Detalhes em dourado metálico (`#EDC066`).
    *   Tipografia elegante e moderna baseada na fonte *Inter* e *Outfit* do Google Fonts.

### 5.2. Layouts Responsivos & Breakpoints
*   **Navegação Inteligente:**
    *   **Desktop (width >= 1024px):** Menu lateral fixo (`Sidebar`) com opção de colapsar manualmente.
    *   **Tablet (768px <= width < 1024px):** Menu lateral colapsado automaticamente para otimizar espaço de tela.
    *   **Dispositivos Móveis (width < 768px):** Ocultação completa da sidebar e substituição por uma barra de guias inferior (`BottomTabBar`) para facilidade de toque com uma mão.
*   **Fallback Seletor de Data:** DateTimePicker desktop customizado e fallback automático para seletores nativos móveis em Android e iOS.

### 5.3. Segurança e Controle de Dados
*   **Políticas RLS no Supabase:** Row Level Security (RLS) configurado em todas as tabelas. Restrições baseadas na função Postgres `public.get_member_type()`.
*   **Next.js Middleware:** Proteção de rotas em nível de middleware verificando a validade do JWT do Supabase e bloqueando acessos não autenticados.
*   **Filtro de Membros Ativos:** Bloqueio e redirecionamento de usuários sem o status `'Ativo'` na tabela pública para a página de permissão.

### 5.4. Performance & Eficiência
*   **Processamento Client-side:** Compactação ZIP delegada inteiramente ao cliente (JSZip), evitando sobrecarga de processamento no servidor backend.
*   **Controle de Concorrência de Drag-and-Drop:** Desativação de interações cruzadas durante o arraste de elementos no painel administrativo para evitar requisições conflitantes.

---

## 6. Modelagem de Dados (Esquema do Banco de Dados)

### 6.1. Tabela: `public.members`
Armazena os perfis públicos e metadados dos membros da plataforma.
*   `id` (UUID, Chave Primária, Referencia `auth.users(id)` com `ON DELETE CASCADE`)
*   `name` (TEXT, Obrigatório)
*   `email` (TEXT, Único, Obrigatório)
*   `role` (TEXT)
*   `company` (TEXT)
*   `industry` (TEXT)
*   `location` (TEXT)
*   `initials` (TEXT)
*   `img` (TEXT, URL do avatar)
*   `bio` (TEXT)
*   `username` (TEXT, Único)
*   `member_type` (ENUM `member_type_enum`: `'admin'`, `'master'`, `'mentor'`, Valor padrão: `'mentor'`)
*   `theme` (TEXT, Valor padrão: `'dark'`)
*   `status` (ENUM `member_status`: `'Ativo'`, `'Inativo'`, Valor padrão: `'Ativo'`)
*   `added_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   `deactivated_at` (TIMESTAMP WITH TIME ZONE)

### 6.2. Tabela: `public.courses`
Define as Masterclasses da plataforma.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `title` (TEXT, Obrigatório)
*   `description` (TEXT)
*   `cover_image_url` (TEXT)
*   `status` (TEXT, Valor padrão: `'rascunho'`)
*   `sequence_order` (INTEGER, Valor padrão: `0`)
*   `slug` (TEXT, Único, Obrigatório)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.3. Tabela: `public.modules`
Representa os módulos dentro de uma Masterclass.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `course_id` (UUID, Chave Estrangeira referenciando `public.courses(id)` com `ON DELETE CASCADE`)
*   `title` (TEXT, Obrigatório)
*   `description` (TEXT)
*   `cover_image_url` (TEXT)
*   `status` (TEXT, Valor padrão: `'published'`)
*   `sequence_order` (INTEGER, Valor padrão: `0`)
*   `slug` (TEXT, Único, Obrigatório)
*   `scheduled_at` (TIMESTAMP WITH TIME ZONE)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.4. Tabela: `public.lessons`
Contém as aulas individuais vinculadas aos módulos.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `module_id` (UUID, Chave Estrangeira referenciando `public.modules(id)` com `ON DELETE CASCADE`)
*   `title` (TEXT, Obrigatório)
*   `description` (TEXT)
*   `long_description` (TEXT)
*   `duration` (TEXT, Obrigatório)
*   `video_url` (TEXT)
*   `thumbnail_url` (TEXT)
*   `cover_image_url` (TEXT)
*   `instructor_name` (TEXT)
*   `instructor_role` (TEXT)
*   `instructor_avatar` (TEXT)
*   `status` (TEXT, Valor padrão: `'published'`)
*   `sequence_order` (INTEGER, Valor padrão: `0`)
*   `slug` (TEXT, Único, Obrigatório)
*   `scheduled_at` (TIMESTAMP WITH TIME ZONE)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.5. Tabela: `public.resources`
Armazena arquivos e materiais de apoio das aulas.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `lesson_id` (UUID, Chave Estrangeira referenciando `public.lessons(id)` com `ON DELETE CASCADE`)
*   `title` (TEXT, Obrigatório)
*   `category` (TEXT, Ex: `spreadsheet`, `document`, `presentation`, `other`)
*   `description` (TEXT)
*   `file_url` (TEXT, Obrigatório)
*   `format` (TEXT)
*   `size` (TEXT)
*   `available_at` (TIMESTAMP WITH TIME ZONE)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.6. Tabela: `public.member_connections`
Rastreia as conexões e solicitações de networking entre os membros.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `requester_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE CASCADE`)
*   `receiver_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE CASCADE`)
*   `status` (TEXT, Valor padrão: `'pending'`)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   `updated_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   *Restrições:* Chave de unicidade composta em `(requester_id, receiver_id)` e verificação de não autorreferência (`requester_id <> receiver_id`).

### 6.7. Tabela: `public.community_posts`
Guarda as postagens compartilhadas no feed da comunidade.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `user_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE SET NULL`)
*   `author_name` (TEXT, Obrigatório)
*   `author_avatar` (TEXT)
*   `author_role` (TEXT)
*   `content` (TEXT)
*   `image_url` (TEXT)
*   `video_url` (TEXT)
*   `likes_count` (INTEGER, Valor padrão: `0`)
*   `liked_by_users` (UUID[], Array de IDs de usuários que curtiram)
*   `saved_by_users` (UUID[], Array de IDs de usuários que salvaram o post)
*   `comments` (JSONB, Array de comentários estruturados com respostas, Valor padrão: `[]`)
*   `post_type` (TEXT, Valor padrão: `'standard'`)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.8. Tabela: `public.lesson_comments`
Armazena comentários associados a aulas específicas.
*   `id` (UUID, Chave Primária, Valor padrão: `gen_random_uuid()`)
*   `lesson_id` (UUID, Chave Estrangeira referenciando `public.lessons(id)` com `ON DELETE CASCADE`)
*   `user_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE CASCADE`)
*   `content` (TEXT, Obrigatório)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.9. Tabela: `public.notifications`
Controle de notificações globais e individuais.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `user_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE CASCADE`, Se nulo: notificação global)
*   `title` (TEXT, Obrigatório)
*   `description` (TEXT)
*   `type` (ENUM `notification_type`: `'mentoria'`, `'atualizacao'`, `'masterclass'`, `'oportunidade'`, `'recurso'`)
*   `link` (TEXT)
*   `is_read` (BOOLEAN, Valor padrão: `FALSE`)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.10. Tabela: `public.calendar_events`
Eventos do calendário de mentorias e reuniões.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `title` (TEXT, Obrigatório)
*   `event_type` (ENUM `calendar_event_type`: `'mentoria'`, `'atualizacao'`, Obrigatório)
*   `event_date` (DATE, Obrigatório)
*   `start_time` (TIME, Obrigatório)
*   `end_time` (TIME, Obrigatório)
*   `mentor_name` (TEXT)
*   `mentor_role` (TEXT)
*   `mentor_avatar` (TEXT)
*   `mentor_bio` (TEXT)
*   `topic` (TEXT)
*   `zoom_link` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.11. Tabela: `public.ecosystem_banners`
Armazena os banners rotativos exibidos no Ecossistema.
*   `id` (UUID, Chave Primária, Valor padrão: `gen_random_uuid()`)
*   `title` (TEXT, Obrigatório)
*   `subtitle` (TEXT)
*   `description` (TEXT)
*   `tag` (TEXT)
*   `image` (TEXT, Obrigatório)
*   `cta_text` (TEXT, Obrigatório)
*   `cta_link` (TEXT, Obrigatório)
*   `disabled` (BOOLEAN, Valor padrão: `false`)
*   `sequence_order` (INTEGER, Valor padrão: `0`)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.12. Tabela: `public.missions`
Armazena as missões e tarefas práticas.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `title` (TEXT, Obrigatório)
*   `description` (TEXT, Obrigatório)
*   `has_text_question` (BOOLEAN, Valor padrão: `false`)
*   `text_question` (TEXT)
*   `has_form_link` (BOOLEAN, Valor padrão: `false`)
*   `form_link` (TEXT)
*   `has_file_upload` (BOOLEAN, Valor padrão: `false`)
*   `file_upload_label` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   `updated_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.13. Tabela: `public.mission_submissions`
Armazena as entregas das missões.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `mission_id` (UUID, Chave Estrangeira referenciando `public.missions(id)` com `ON DELETE CASCADE`)
*   `student_id` (UUID, Chave Estrangeira referenciando `public.members(id)` com `ON DELETE CASCADE`)
*   `text_answer` (TEXT)
*   `form_submitted_link` (TEXT)
*   `file_url` (TEXT)
*   `file_name` (TEXT)
*   `status` (TEXT, restrito a `pending`, `approved`, `rejected`, Valor padrão: `'pending'`)
*   `feedback` (TEXT)
*   `submitted_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   `reviewed_at` (TIMESTAMP WITH TIME ZONE)
*   `reviewed_by` (UUID, Chave Estrangeira referenciando `public.members(id)` com `ON DELETE SET NULL`)
*   *Restrições:* Índice único composto em `(mission_id, student_id)`.

### 6.14. Tabela: `public.story_views`
Rastreia as visualizações de Stories.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `story_id` (UUID, Chave Estrangeira referenciando `public.community_posts(id)` com `ON DELETE CASCADE`)
*   `viewer_id` (UUID, Chave Estrangeira referenciando `public.members(id)` com `ON DELETE CASCADE`)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   *Restrições:* Índice único composto em `(story_id, viewer_id)`.

### 6.15. Tabela: `public.investment_opportunities`
Contém as definições e registros das oportunidades de co-investimento.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `slug` (TEXT, Único, Obrigatório)
*   `title` (TEXT, Obrigatório)
*   `category` (TEXT, Obrigatório)
*   `category_label` (TEXT)
*   `description` (TEXT)
*   `long_description` (TEXT)
*   `image_url` (TEXT)
*   `badge` (TEXT)
*   `target_irr` (TEXT)
*   `min_investment` (TEXT)
*   `status` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.16. Tabela: `public.projects`
Guarda os projetos reais disponíveis para download e simulação.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `title` (TEXT, Obrigatório)
*   `category` (TEXT, Obrigatório)
*   `description` (TEXT)
*   `image_url` (TEXT)
*   `status` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

### 6.17. Tabela: `public.user_lesson_progress`
Registra o progresso de visualização de aulas por cada aluno.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `user_id` (UUID, Chave Estrangeira referenciando `auth.users(id)` com `ON DELETE CASCADE`)
*   `lesson_id` (UUID, Chave Estrangeira referenciando `public.lessons(id)` com `ON DELETE CASCADE`)
*   `watched_seconds` (INTEGER, Valor padrão: `0`)
*   `total_seconds` (INTEGER, Valor padrão: `0`)
*   `percent_complete` (INTEGER, Valor padrão: `0`)
*   `completed` (BOOLEAN, Valor padrão: `false`)
*   `last_watched_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)
*   *Restrições:* Índice único composto em `(user_id, lesson_id)`.

### 6.18. Tabela: `public.webhook_logs`
Guarda registros e logs históricos de webhooks integrados.
*   `id` (UUID, Chave Primária, Valor padrão: `uuid_generate_v4()`)
*   `type` (TEXT, Tipo do evento recebido, Obrigatório)
*   `email` (TEXT)
*   `payload` (JSONB)
*   `created_at` (TIMESTAMP WITH TIME ZONE, Valor padrão: `now()`)

---

## 7. Regras de Negócio Críticas

1.  **Visibilidade Temporal Estrita:**
    *   Um recurso (`resources`), módulo (`modules`) ou aula (`lessons`) com status `'agendado'` ou data de liberação (`available_at`/`scheduled_at`) superior ao horário atual do sistema **não deve ser exibido** nem retornado em consultas para usuários comuns (`member_type = 'mentor'` ou `'master'`).
2.  **Unicidade de Username:**
    *   Qualquer edição ou criação de perfil contendo um valor no campo `username` deve ser verificada contra duplicatas. Em caso de conflito, a operação retorna erro 23505 (Unique Violation) e a interface deve notificar o usuário amigavelmente.
3.  **Processamento ZIP Lado do Cliente:**
    *   Em aulas com múltiplos recursos anexados, o download deve ser unificado em um `.zip` gerado localmente pelo JSZip no navegador do usuário, evitando o uso de processamento de compressão e armazenamento temporário no backend.
4.  **Auto-Rollback no Cadastro Secreto:**
    *   O cadastro de mentorado em `/cadastro-mentorados` deve ser atômico. Se o cadastro no Supabase Auth funcionar mas a inserção do perfil em `public.members` falhar, a API de backend deve deletar imediatamente o usuário do Auth para evitar contas fantasmas sem perfil.
5.  **Exclusão de Conexões:**
    *   Desfazer uma conexão deve remover o registro da tabela `member_connections` independentemente de quem iniciou a solicitação original (requester ou receiver).
6.  **Gerenciamento de Banners:**
    *   Banners com status desativado (`disabled = true`) não devem ser retornados na listagem pública da página de Ecossistema.
    *   A reordenação de banners deve atualizar de forma transacional/simultânea o campo `sequence_order` no banco de dados para evitar inconsistência visual.
7.  **Bloqueio de Submissão Aprovada:**
    *   Um aluno não pode editar ou reenviar uma missão cujo status de envio já esteja marcado como `'approved'` (Concluído), garantindo a imutabilidade das entregas finalizadas.
    *   Se a submissão estiver como `'rejected'`, o aluno pode reenviar novos dados, o que redefinirá automaticamente o status para `'pending'` e limpará o feedback anterior.
8.  **Tutorial de Onboarding:**
    *   O tutorial do Dashboard deve ser disparado apenas na primeira entrada do usuário caso o item `cls_skip_tutorial` não esteja marcado no localStorage.

---

## 8. Integrações & Webhooks

### 8.1. Hubla Webhook (`/api/webhook/hubla`)
*   **Objetivo:** Sincronizar automações de vendas e liberação/revogação de acessos dos membros.
*   **Autenticação:** O cabeçalho `x-hubla-token` deve ser validado contra o token privado de integração (`process.env.HUBLA_WEBHOOK_TOKEN`).
*   **Operações:**
    *   `customer.member_added`: Cria ou ativa o membro no banco simulado local `members.json` com status "Ativo".
    *   `customer.member_removed`: Atualiza o status do membro para "Inativo", registrando a data de desativação.

---

## 9. Pipeline de Implantação e Build
*   **Build Servidor:** Todo build de compilação da aplicação Next.js é realizado exclusivamente no servidor de hospedagem (Vercel) no momento do push/deploy.
*   **Proibição de Compilação Local:** Conforme as diretrizes do projeto, não deve ser executado nenhum comando de build de produção local (`pnpm run build` ou similar) antes do envio dos commits para evitar poluição do repositório ou conflito de binários.
