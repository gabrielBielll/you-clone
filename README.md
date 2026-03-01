# Teste Vertex: Front-End (YouTube Clone)

Este projeto foi construído para o processo seletivo de vaga **Frontend Sênior** da **Vertex Digital**. Ele consome e interage com as principais listagens e detalhes da **YouTube Data API v3**.

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js (v18+)

### 1. Instalação e Configuração

Clone o repositório e rode os seguintes passos:

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente baseadas no .env.example
cp .env.example .env
```

**Importante:** Gere sua API KEY em [Google Cloud Console](https://console.cloud.google.com/) ativando a `YouTube Data API v3` e coloque em seu `.env` na chave `VITE_YOUTUBE_API_KEY`.

### 2. Rodar a Aplicação

```bash
# Iniciando o servidor de desenvolvimento
npm run dev
```

Acesse no browser: `http://localhost:5173`.

### 3. Rodar os Testes Unitários

Foi implementada uma suíte focada na Store (regras de negócio de busca, acréscimos de paginação e error handling API).

```bash
npm run test
```

---

## 🛠️ Relatório Técnico & Arquitetura (Visão Sênior)

Visando um código de fácil manutenção, tipado, testável e de alta performance, baseamos o desenvolvimento nas seguintes premissas e tecnologias:

### Stack Tecnológico:

- **Vue 3 (Composition API / `<script setup>`)**: Preferível ao Options API tradicional dos sistemas legados de Vue 2, permitindo melhor modularidade (composable) e suporte limpo ao TypeScript.
- **Vite**: Para builds extremamente rápidos comparados ao obsoleto Vue CLI ou Webpack puro.
- **TypeScript**: Estrita tipagem do Payload do complexo ecossistema do YouTube. Isso previne centenas de erros de _runtime_.
- **Pinia**: Escolhido no lugar do Vuex (oficialmente descontinuado no Vue 3 pela equipe core). **Decisão de UX importante**: O Pinia mantém o estado de vídeos renderizados em cache com o Token de Paginação; assim, usar o botão "Voltar" a partir da tela de "Detalhes do Vídeo" não regera uma requisição cara para a API — o _scroll_ e os componentes são revistos liminarmente no estado e páginação que foram deixados na busca, criando uma fluidez real de _Mobile app_.
- **Vuetify 3**: Cumprindo as regras estritas da especificação pedia sobre _Google Material Design_, o framework proveu grid dinâmico _Mobile-First_, com utilitários de display integrados.
- **Axios**: Centralizando requisições via instância global controlada com interceptadores dinâmicos para injetar a API Key do `.env`.

### Observações Funcionais (Edge Cases)

#### 1. "O Caso do Deslike"

Em requisição formal desta documentação, e mantendo acompanhamento das diretrizes e evolução de APIs do mercado: **O Youtube depreciou o método de retorno de Dislikes de suas requisições públicas de busca (`/videos?part=statistics`) desde as mais recentes rodadas de atualização sob políticas de "proteção ao criador/deslike massivo".**
Ainda que a contagem de _Dislike_ original não retorne pelo `part=statistics` como publicamente visou um dia, adicionei a versão **Mockada (visual)** do botão pela UI, acompanhando a evolução orgânica imposta pelos Designers Originais do material design onde a UX precisa indicar a possibilidade, mesmo que o valor do contador seja omitido publicamente.

#### 2. Responsividade Mobile-First

Todo o Grid baseado em flexbox de `12-colunas` usando classes como `xs`, `sm`, `md` e `lg` foi desenvolvido para garantir que o _VideoCard_ escorra responsivamente desde smartphones de (320px) com Cards expandidos no 100% de block, até desktops ultrawides que apresentam até 4 ou 5 colunas de forma graciosa. E o Player via _iframe_ utiliza truques modernos CSS (`padding-bottom: 56.25%`) para suportar forçadamente qualquer _resize_ de tela no aspect _16:9_.

### 🌟 Funcionalidades Avançadas (Showcase Sênior)

Além do escopo original do clone padrão, arquitetamos as seguintes soluções para demonstrar escalabilidade robusta, UX excepcional e domínio profundo de Stores:

- **Paginação Dupla Inteligente e Laços Transparentes**: O endpoint de `/search` do YouTube costuma poluir buscas genéricas devolvendo apenas Shorts (`videoDuration='short'`). A nossa `Pinia Store` foi recriada usando uma "Paginação com Garantia Mínima". Um laço `while` assíncrono trabalha em segundo plano esvaziando a API repetidas vezes até conseguir separar nativamente **no mínimo 6 vídeos longos** para alimentar exclusivamente o painel infinito principal, garantindo que o seu _Scroll_ de mouse nunca esbarre em blocos vazios!
- **Carrossel Nativo e Requisição Restrita**: Para as prateleiras do topo da página ("Shorts"), nós disparamos buscas exclusivas (`loadMoreShorts()`) injetando a flag estrita `videoDuration="short"` da API Google. Dessa forma, ela nos devolve apenas vídeos orgânicos de baixo tempo, renderizados num componente Vue horizontal exclusivo respeitando _aspect-ratio_ mobile 9:16. E tudo isso com _tokens_ isolados na memória.
- **Micro-Engine de LocalStorage (Histórico Offline)**: Criado para dar vida à Categoria `Histórico` da _Sidebar_. Toda vez que o `<VideoCard>` é clicado ou roteado, o Push não se restringe à URL; ele dispara uma Action da View para o Store injetando uma _Payload JSON_ otimizada na memória persistente liminar do navegador do usuário até o hard-limit de `50` vídeos. Com apenas um clique, o Store "aborta" a conexão HTTP de Categoria e espelha em 0.1ms o cache do seu HD no GridLayout original da tela.
- **Drawer e Filtros Injetáveis (Router)**: Implementamos o Layout Base do Material (`App.vue` com V-App-Bar e V-Navigation-Drawer dinâmico). Nele as Categorias (Música, Jogos) não são estáticas — elas integram nativamente com o App e engatilham Hooks preenchendo novos Motor-States do Pinia. O menu lateral empurra seu conteúdo como no YouTube Web oficial.
- **Otimização N+1 Queries (Batch Requesting)**: Para contornar a limitação da API que não envia `duration` nas listagens, o `loadMore` agrupa os 20 IDs encontrados e dispara **uma única** segunda viajação na rede na API restrita de `contentDetails`. Formatando com funções regex proprietárias o parse ISO 8601 (`PT4M5S` para `04:05`). Isso não queima os limites mensais do Google Cloud Platform!
