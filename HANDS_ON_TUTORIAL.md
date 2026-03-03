# 🛠️ Hands-on Tutorial: YouClone - Construindo o YouTube Clone

Bem-vindo ao guia prático e arquitetural de construção desta aplicação. Este documento foi elaborado para detalhar o processo de desenvolvimento, as minhas escolhas de engenharia, os trade-offs (trocas) assumidos e o passo a passo da implementação, saindo do zero até a entrega final.

O objetivo principal deste material é fornecer total transparência sobre a linha de raciocínio lógico que guiou a criação do projeto, demonstrando não apenas como optei por escrever o código, mas principalmente o porquê de cada decisão técnica — um pilar fundamental no desenvolvimento de software e projetos escaláveis.

## 0. Checklist de Requisitos e Diferenciais

Antes de iniciar a escrita de qualquer linha de código, mapeei rigorosamente o escopo. O planejamento prévio evita refatorações desnecessárias e garante que a arquitetura inicial suporte todas as funcionalidades que idealizei.

**Requisitos Base (MVP - Minimum Viable Product):**

- [x] Tela Inicial: Formulário de busca centralizado com foco em usabilidade.
- [x] Busca: Validação de input (campo não vazio) para evitar chamadas de rede desnecessárias.
- [x] Animação CSS: Mover a barra de busca para o topo ao realizar a pesquisa de forma fluida.
- [x] Integração API (Busca): Chamada para `/search?part=id,snippet&q={termo}` de forma otimizada.
- [x] Lista de Resultados: Exibir Título, Descrição, Thumbnail e Link de Detalhes em um layout responsivo.
- [x] Paginação: Utilizar tokens da API do YouTube (`nextPageToken` / `prevPageToken`) manipulando cursores.
- [x] Tela de Detalhes: Rota dinâmica com base no `videoId` extraído da listagem.
- [x] Integração API (Detalhes): Chamada para `/videos?id={VIDEO_ID}&part=snippet,statistics`.
- [x] UI Detalhes: Embed do iframe (player), Título, Descrição, Visualizações, Likes e Dislikes.
- [x] Navegação de Retorno: Botão voltar que preserva estritamente o estado da busca, a lista anterior e a página ativa.

**Funcionalidades Extras (Diferenciais Arquiteturais):**

- [x] Comentários Reais: Integração de API dedicada para exibir comentários autênticos, lidando com Lazy Loading.
- [x] Shorts em Carrossel: Aba exclusiva e UI horizontal focada em vídeos curtos, adaptando proporções de tela.
- [x] Menu Lateral e Filtros: Navegação global por categorias (Sidebar) reaproveitando o motor de estado global.
- [x] Histórico de Visualização: Registro persistente utilizando a API de LocalStorage do navegador.
- [x] Inteligência Artificial: Modal interativo (Ask AI) operando contexto de vídeo com a API do Gemini.
- [x] Pipeline de CI/CD: Automação de deploy configurada via GitHub Actions.

## 1. Setup Inicial e Definição da Arquitetura

Para garantir uma base sólida, escalável e com excelente DX (Developer Experience), inicializei o projeto utilizando **Vite** em conjunto com **Vue 3** (Composition API) e **TypeScript**.

**Por que escolhi o Vite?**
Em comparação ao antigo Webpack ou Vue CLI, o Vite utiliza módulos ES nativos no navegador durante o desenvolvimento. Isso resulta em um tempo de inicialização (_Cold Start_) quase instantâneo e um _Hot Module Replacement (HMR)_ extremamente rápido.

```bash
# Criando a estrutura base
npm create vite@latest clone-youtube -- --template vue-ts
cd clone-youtube
npm install
```

A estrutura de pastas foi rigorosamente dividida baseada no princípio de Separação de Responsabilidades (_Separation of Concerns_):

- `src/components/`: _Dumb Components_. Focados puramente em receber props e emitir eventos (UI pura).
- `src/plugins/`: Setup de bibliotecas externas (Vuetify, ícones).
- `src/router/`: Definição e mapeamento de rotas via Vue Router.
- `src/services/`: Camada de abstração HTTP, lidando estritamente com requisições externas via Axios.
- `src/stores/`: O "cérebro" da aplicação. Gerenciamento de estado global reativo via Pinia.
- `src/types/`: _Single Source of Truth_ para tipagens. Interfaces TypeScript que mapeiam os JSONs completos da API do Google.
- `src/views/`: _Smart Components_. Páginas que injetam dependências, acessam Stores e orquestram a iteração com os menores componentes.

## 2. Configurando o Vuetify 3 (Material Design)

Para seguir o **Google Material Design** de maneira consistente, e visando não criar CSS puramente do zero sem padronização, optei por utilizar o ecossistema maduro do **Vuetify 3**. A camada de UI permite focar na lógica de negócio ao invés de reinventar componentes básicos de layout. Além da garantia do Material, ganhei um motor de grid e acessibilidade avançados.

No arquivo `src/plugins/vuetify.ts`, injetei globalmente o layout forçando o **Dark Mode** com a verdadeira paleta de cores do YouTube real:

```typescript
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "dark", // 🌙 Foco automático no Dark Mode
    themes: {
      dark: {
        colors: {
          primary: "#FF0000", // YouTube Red oficial
          background: "#0F0F0F", // Escuro profundo do player
          surface: "#0F0F0F",
        },
      },
    },
  },
});
```

## 3. A Camada de Serviços, Segurança e Integração HTTP

A comunicação com APIs de terceiros exige cautela. Inserir chamadas `fetch` soltas dentro de componentes Vue cria acoplamento alto, dificulta testes e é perigoso para as chaves de acesso.

### A Instância do Axios

Criei uma abstração limpa configurando um cliente HTTP centralizado. Isso garante que a URL base e a chave de API (protegida via variável de ambiente) não andem "soltas" pela Store, sendo injetadas automaticamente em todas as chamadas por um _Interceptor_.

**Arquivo:** `src/services/api.ts`

```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
});

// Interceptor: Antes da request sair, injeto a segurança
api.interceptors.request.use((config) => {
  config.params = config.params || {};
  // Injeta a token do ambiente .env sem sujar o código dos componentes!
  config.params.key = import.meta.env.VITE_YOUTUBE_API_KEY;
  return config;
});
```

### O Serviço do YouTube Isolado

Os componentes Vue não precisam saber quais parâmetros a API do Google exige. Eles apenas chamam os métodos de negócio que o módulo exporta.

**Arquivo:** `src/services/youtube.service.ts`

```typescript
import { api } from "./api";
import type {
  YouTubeSearchResponse,
  YouTubeVideoResponse,
} from "../types/youtube";

export const youtubeService = {
  async searchVideos(
    query: string,
    pageToken?: string,
  ): Promise<YouTubeSearchResponse> {
    const { data } = await api.get("/search", {
      params: {
        part: "snippet",
        q: query,
        maxResults: 15,
        pageToken,
        type: "video",
      },
    });
    return data;
  },
};
```

## 4. O Coração - Gerenciando Estado com Pinia

O requisito mais complexo exigia que eu propiciasse ao usuário a permanência de busca: ao clicar em "Voltar" na tela de detalhes, ele encontrasse a pesquisa e a listagem de paginação exatamente na posição onde as deixou. A abordagem contundente foi utilizar o **Pinia** (O Store que substituiu o aposentado Vuex) como _Single Source of Truth_.

Criei uma base blindada que faz chamadas HTTP, "engorda" o _array_ de vídeos usando paginação contínua e, o mais importante, opera tratamentos visuais e lógicos contornando o _Rate Limit_ gratuito do Google.

**Arquivo central:** `src/stores/useYoutubeStore.ts`

```typescript
import { defineStore } from "pinia";
import { youtubeService } from "@/services/youtube.service";

export const useYoutubeStore = defineStore("youtube", {
  state: () => ({
    searchQuery: "",
    videos: [] as any[],
    nextPageToken: null as string | null,
    isLoading: false,
    errorMessage: null as string | null,
  }),
  actions: {
    async fetchVideos(query: string, pageToken?: string) {
      this.isLoading = true;
      this.searchQuery = query;

      try {
        const data = await youtubeService.searchVideos(query, pageToken);
        // Paginação Inteligente: Se houver um token, incrementamos. Senão, array resetado.
        this.videos = pageToken ? [...this.videos, ...data.items] : data.items;
        this.nextPageToken = data.nextPageToken || null;
      } catch (error: any) {
        // Se a API barrar, mandamos um sinal para o Vue exibir um banner agradável
        if (error.response?.data?.error?.message?.includes("quota")) {
          this.errorMessage = "LIMITE_COTA";
        } else {
          this.errorMessage = "Perdemos o contato com o YouTube 🤔";
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
});
```

## 5. Construindo a Tela Inicial e Animações de Alta Performance

Um desafio de UI desenhado neste projeto foi ter o campo de pesquisa originalmente centralizado no meio da tela no primeiro acesso, de modo que ele não retornasse ao centro nos próximos acessos da mesma pesquisa, ficando restrito ao topo de forma suave.

Fiz mais que o básico. Na `HomeView.vue`, adicionei uma "Sensação Especial". Se não existe pesquisa, eu engatilho visualmente as transições de margem pelo próprio CSS. Isso preza as diretrizes core-web-vitals, evitando _reflows_ pesados engatilhados por JS.

**Arquivo:** `src/views/HomeView.vue`

```vue
<template>
  <v-container
    :class="{ 'search-centered': !hasSearched, 'search-top': hasSearched }"
    class="transition-container"
  >
    <AppSearchBar @search="handleSearch" />

    <!-- Hero/Bg inicial sumirá e a Lista de resultados surgirá após a busca -->
    <v-row v-if="hasSearched">
      <v-col v-for="video in youtubeStore.videos" :key="video.id.videoId">
        <VideoCard :video="video" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Transição suave usando curvas cúbicas ao invez de keyframes puros */
.transition-container {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.search-centered {
  margin-top: 30vh;
}
.search-top {
  margin-top: 2vh;
}
</style>
```

## 6. A Tela de Detalhes, Iframes e O `<keep-alive>` Mágico

Na Rota `/video/:id`, a view se encarrega da exibição do embed do player via _iframe_ responsivo e das métricas, formatando a visualização para manter corretamente a proporção geométrica (padding tricks para _16:9_).

Mas como eu frizei no tópico de Estado (Pinia), havia o grande desafio do "Voltar". Se eu utilizasse rotas primitivas para renderizar o componente original limpando o ciclo de vida (_onMounted_), a lista iria resetar e queimar mais dados do cliente no Google.

**A minha solução:** Envelopei indiretamente os componentes da Rota (Router View) que não devem perder o estado numa marcação do próprio Vue chamada `<keep-alive>`. Assim, quando o botão invoca `$router.back()` da tela do vídeo, o Vue simplesmente "descongela" o HTML inteiro de buscas renderizado nas distâncias originais e no item recém clicado.

**Arquivo:** `App.vue`

```vue
<template>
  <v-main>
    <router-view v-slot="{ Component }">
      <!-- Mantenho a Home (e suas listas carregadas) vivas na memória do browser! -->
      <keep-alive include="HomeView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </v-main>
</template>
```

## 7. Indo Além - Arquitetura das Funcionalidades Extras (Diferenciais)

Além do escopo original do clone padrão simples, implementei e desenhei as soluções abaixo para escalar as interações de forma substancial:

**1. Otimização N+1 Queries (Batch Requesting)**
A API pública do Youtube não devolve a "duração" (`duration`) dos vídeos na mesma consulta inicial de "buscar listas". Para contornar, o _action loadMore_ engloba todos os "IDs de vídeos" renderizados (num Array Map) e dispara **uma única** segunda chamada REST apontando para os detalhes em Batch. Por baixo formulo os resultados lidos no formato ISO 8601 string (`PT4M5S` virando textualmente `04:05`). Isso não esgota a franquia do desenvolvedor no Google Console.

**2. Comentários Reais da Comunidade**
Para renderizar interações autênticas do vídeo acessado sem engasgar o carregamento do _vídeo iframe_, decidi isolar e instanciar o componente `<VideoComments />` para funcionar por via _Lazy Loading_ secundário assíncrono.

```html
<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { api } from "@/services/api";

  const props = defineProps<{ videoId: string }>();
  const comments = ref([]);

  onMounted(async () => {
    // Chamada independente sem travar o TTI (Time to Interactive) dinâmico via Axios
    const { data } = await api.get("/commentThreads", {
      params: { part: "snippet", videoId: props.videoId, maxResults: 10 },
    });
    comments.value = data.items;
  });
</script>
```

**3. Histórico de Visualizações Persistente**
Sempre que um vídeo é aberto ou recebe cliques, uma Action secundária na Store intercepta a visualização e sincroniza os metadados em tempo real na aba _Histórico_. Eu persisto essa cadeia local no próprio HD/Navegador do usuário, limitando o seu tamanho (Shift Arrays) de 50 nós, para não onerar o cache de memória do Browser no LocalStorage.

```typescript
// Extensão de array em src/stores/useYoutubeStore.ts
actions: {
  addToHistory(videoData: any) {
    // Evita duplicatas recolocando o vídeo acessado no topo cronológico
    this.history = this.history.filter(v => v.id !== videoData.id);
    this.history.unshift(videoData);

    // Hard Limite no cache Storage!
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('yt_clone_history', JSON.stringify(this.history));
  }
}
```

**4. Inteligência Artificial Integrada (Ask AI)**
Dado a alta de Chatbots generativos em plataformas nativas de consumo de videos, integrei a API livre do "Google Gemini Flash 2.5", elaborando em cima o Modal de interação. Quando você abre um Vídeo, eu crio uma camada oculta no Prompt nativo unindo o _Title_ e o _Description_ do criador. Isso abastece os parâmetros para resumos na mosca, gerando respostas incríveis sem precisarmos da custosa "transcrição do aúdio".

## 8. Integração Contínua e Setup de Qualidade (CI/CD e Testes)

Código maduro é código testado e entregue de forma automatizada:

- **Testes Unitários:** Para a suite de testes locais, decidi pelo uso do `Vitest` em lugar do Jest ou pesados Karma/Mocha. O Vitest (com arquivo isolado `useYoutubeStore.spec.ts`) garante que a lógica mental do Store não retroceda as métricas nas próximas manutenções, usando `vi.fn()` para mockar retornos perfeitos do Axios.
- **CI/CD Pipeline:** Todo ecossistema foi injetado através da Action Github. A aplicação lê meu repositório e atesta que a cada novo _Push_ na ramificação core (`main`), um job autônomo executa as checagens e compõe o bundle estático direcionando-os à uma Branch _Gh-pages_, onde o Github o disponibilizará como site livre para testar.

## 9. Resumo Crítico das Boas Práticas Empregadas

- **Princípio de Responsabilidade Única (SRP):** Códigos que fazem apenas uma coisa. O Vue manipula a DOM e escuta as diretivas, a Service do Axios atende as saídas de rede, a Store do Pinia gerencia cache, e os Components reciclam layouts. Essa separação drástica me assegurou um código imune ao fenômeno "spaghetti".
- **Tipagem Estática Refinada e Contratos:** Apliquei TypeScript nativo em `youtube.d.ts`. Mapeei as instâncias de JSON longas para classes estriadas (_Snippet, Id, Statistics_). A segurança provada por compilador preveniu centenas de exceçòes imprevisíveis de runtime relacionadas a tags malucas do json sem a necessidade do Console log.
- **Escalabilidade Componentizada:** Novas _features_ e paineis laterais implementadas (Carrossel Horizontal de Shorts, Comentários interativos, Abas de Categorias) não inflaram os pontos de raízes (`App.vue` / `HomeView.vue`). Toda parte secundária tem suas lógicas de _onMounted()_ desvinculadas por componentes e passadores via V-Bindings e Emits. Extremamente coeso para equipes maduras e futuras expansões de arquitetura.
