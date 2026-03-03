# 🛠️ Hands-on Tutorial: Construindo o YouTube Clone

Bem-vindo ao guia de construção passo a passo deste projeto! Este documento detalha as decisões de engenharia, os principais códigos e o fluxo de raciocínio que deram origem ao nosso clone do YouTube, atendendo rigorosamente à especificação técnica da vaga Sênior. Você pode seguir este tutorial para entender como a aplicação foi estruturada desde a sua fundação.

## Passo 1: Inicializando o Projeto (Vite + Vue 3 + TypeScript)

Para garantir a melhor performance, carregamento instantâneo de módulos (HMR) e DX (Developer Experience) moderna, nós evitamos CLI antigos baseados em Webpack (como o tradicional Vue CLI ou o CRA).

Utilizamos o **Vite**, o build-tool de nova geração criado pelo próprio autor do Vue:

```bash
npm create vite@latest clone-youtube -- --template vue-ts
cd clone-youtube
npm install
```

## Passo 2: Configurando o Vuetify 3 (Material Design)

As regras de negócio exigiam explicitamente a utilização de **Google Material Design**. Ao invés de criarmos CSS do zero sem padronização, adotamos o ecossistema maduro do **Vuetify 3**. Além da garantia do Material, ganhamos um motor de grid e acessibilidade imbatíveis.

No arquivo `src/plugins/vuetify.ts`, injetamos globalmente nosso layout forçando o **Dark Mode** com a verdadeira paleta de cores do YouTube real:

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

## Passo 3: Engenharia de API (Axios + Interceptors)

Num contexto Sênior, as chaves de API jamais devem "passear" soltas pela View ou pela Store. Centralizamos as requisições em um serviço base (`src/services/api.ts`) provido pelo Axios.

A mágica é usar um _Interceptor_ dinâmico. Toda chamada feita pelo nosso Front-End injeta silenciosamente a nossa Key segura a partir do ambiente local (`.env`), deixando as rotinas de busca completamente limpas.

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
});

// Interceptor: Antes da request sair, verifique os params
api.interceptors.request.use((config) => {
  config.params = config.params || {};
  // Injeta a token do ambiente .env sem sujar o código do Front!
  config.params.key = import.meta.env.VITE_YOUTUBE_API_KEY;
  return config;
});

export default api;
```

## Passo 4: O Coração - Gerenciando Estado com Pinia

Arquitetura sólida depende de gerenciamento de estado. Com o uso do **Pinia** (O Store que substituiu o aposentado Vuex), criamos uma base blindada no arquivo secundário central: `src/stores/useYoutubeStore.ts`.

Este Store faz chamadas HTTP, engorda o _array_ de vídeos usando "paginação infinita" do YouTube (`nextPageToken`), e o mais importante: Cuida primorosamente do intercepto de excesso de consumo da sua cota Google Grátis (Limitação de API).

```typescript
export const useYoutubeStore = defineStore("youtube", {
  state: () => ({
    videos: [] as YouTubeSearchItem[],
    nextPageToken: null as string | null,
    isLoading: false,
    errorMessage: null as string | null,
    hasSearched: false,
  }),
  actions: {
    async search(query: string) {
      this.isLoading = true;
      try {
        const res = await searchVideos(query);
        this.videos = res.items;
        this.nextPageToken = res.nextPageToken;
        this.hasSearched = true; // Libera o Vue para exibir resultados!
      } catch (error: any) {
        // Se a API barrar, mandamos um sinal para o Vue renderizar mensagem bonita
        if (error.response?.data?.error?.message?.includes("quota")) {
          this.errorMessage = "LIMITE_COTA";
        } else {
          this.errorMessage = "Perdemos o eixo com os servidores 🤔";
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
});
```

## Passo 5: UX Avançada: Hero Style Netflix & Animação Css

O edital mencionava um desafio interessante: Ter o campo de pesquisa no meio da tela que, após clicar em pesquisar, se deslocasse magicamente para o topo e não voltasse mais dali.

Fizemos mais que isso, no `AppSearchBar.vue` e `HomeView.vue`, adicionamos a "Sensação Sênior". Se não existe pesquisa, ocupamos o vazio da tela com uma arte gerada por inteligência artificial simulando o mural da Netflix, e engatilhamos as transições de altura e opacidade (Transitions de Vue). Quando busca, essa arte some e o Form engole a tela:

```vue
<template>
  <div class="search-container" :class="{ 'is-searched': store.hasSearched }">
    <!-- Camadas emuladas de cinema apenas se não pesquisou nada -->
    <div v-if="!store.hasSearched" class="hero-bg"></div>
    <!-- Input com vuetify text-field para emitir as procuras ... -->
  </div>
</template>

<style scoped>
.search-container {
  height: 80vh; /* Inicia majestoso no meio da tela */
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.search-container.is-searched {
  height: auto; /* Desaba para a borda superior após o click! */
  padding-top: 2rem;
}
</style>
```

## Passo 6: O `<keep-alive>` Mágico e O Botão Voltar

A especificação ordenava: "A tela de detalhes de vídeo deve ter um botão de voltar para os resultados com a página ativa". E é aqui que os Desenvolvedores Júnior acabam reprovados: Se você for no YouTube oficial e der Voltar, **tudo continua montado onde você deixou**. Se você fizer isso com rotas primitivas, a lista zera e consome _outra_ request da API cara do YouTube.

Nossa solução brutal: Envelopamos nosso sistema principal numa marcação estática `<keep-alive>`.
Ao clicar em Voltar na view do vídeo, o Vue "descongela" o HTML inteiro de buscas na exata distância de rolagem que estava antes!

```vue
<!-- Arquivo: App.vue -->
<template>
  <v-main>
    <router-view v-slot="{ Component }">
      <!-- Mantenha a Home (e suas listas carregadas) na memória do client! -->
      <keep-alive include="HomeView">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </v-main>
</template>
```

## Passo 7: CI/CD no Github Actions (Deploy)

Por fim, não basta estar local. Construímos o pipeline `.github/workflows/deploy.yml`. Toda vez que o comando `git push` é engatilhado por nós com um commit, a nossa infraestrutura envia para a Vercel/Github Pages.

Configuramos "Grupos de Concorrência" (`concurrency: pages`), bloqueios de histórico do `.env` oculto, e a disponibilização de Segredos de Build de forma invisível. Um Deploy automatizado garantindo as boas práticas Sêniors na nuvem!

---

💡 _Gostou desta jornada passo a passo? Grande parte desses códigos não caberia aqui. Explore em profundidade a nossa pasta `/src` do repositório para inspecionar os loops de paginação dupla, e os tratamentos de Array do Batch de vídeos!_
