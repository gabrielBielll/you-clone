<script setup lang="ts">
import { ref, computed } from "vue";
import { useYoutubeStore } from "../stores/useYoutubeStore";
import AppSearchBar from "../components/AppSearchBar.vue";
import VideoCard from "../components/VideoCard.vue";
import ShortVideoCard from "../components/ShortVideoCard.vue";

const store = useYoutubeStore();

const searchQuery = ref(store.searchQuery);

const handleSearch = (query: string) => {
  // Always defaults to 'Tudo' on a fresh main search from the big bar
  store.search(query, "Tudo");
};

const categories = [
  "Tudo",
  "Música",
  "Jogos",
  "Ao Vivo",
  "Notícias",
  "Histórico",
];

const selectCategory = (category: string) => {
  if (category === "Histórico") {
    store.loadHistory();
  } else {
    // Triggering search through store with category append
    store.search(store.searchQuery, category);
  }
};

const loadMore = () => {
  store.loadMore();
};

// Show skeleton only on initial load (when there are no videos yet)
const showInitialSkeletons = computed(
  () =>
    store.isLoading &&
    store.videos.length === 0 &&
    store.shortVideos.length === 0,
);
// Show load more button if there's a token and not currently loading the first page
const canLoadMore = computed(() => !!store.nextPageToken);

// Computed Arrays mapeados integralmente da nova engine do Pinia
const shortVideos = computed(() => store.shortVideos);
const normalVideos = computed(() => store.videos);
</script>

<template>
  <v-container fluid class="fill-height align-start">
    <div class="w-100">
      <!-- Barra de Busca Animada -->
      <AppSearchBar
        v-model="searchQuery"
        @submit="handleSearch"
        :loading="store.isLoading && store.videos.length > 0"
        :hasSearched="store.hasSearched"
      />

      <!-- Espaço para erros globais da API -->
      <!-- Espaço Elegante para Erros (Condicionais) -->
      <v-container
        v-if="store.errorMessage"
        class="fill-height d-flex flex-column justify-center align-center text-center mt-12 py-12"
      >
        <template v-if="store.errorMessage === 'LIMITE_COTA'">
          <v-icon
            icon="mdi-account-clock"
            color="warning"
            size="120"
            class="mb-6 opacity-70"
          ></v-icon>
          <h2 class="text-h4 font-weight-bold mb-2 text-grey-lighten-1">
            Cota Mísseis Esgotada 🚀
          </h2>
          <p class="text-body-1 text-grey mb-6" style="max-width: 600px">
            A chave da API (gratuita) chegou ao limite de requisições fornecidas
            para hoje. A interface continuará pronta para operar suas pesquisas
            amanhã!
          </p>
        </template>
        <template v-else>
          <v-icon
            icon="mdi-youtube-tv"
            color="grey-darken-2"
            size="120"
            class="mb-6 opacity-50"
          ></v-icon>
          <h2 class="text-h4 font-weight-bold mb-2 text-grey-lighten-1">
            Erro de Conexão
          </h2>
          <p class="text-body-1 text-grey mb-6" style="max-width: 600px">
            {{ store.errorMessage }}
          </p>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-refresh"
            @click="handleSearch(searchQuery)"
            rounded="pill"
          >
            Tentar Novamente
          </v-btn>
        </template>
      </v-container>

      <!-- Category Filter Chips -->
      <v-slide-group v-if="store.hasSearched" class="mb-4" show-arrows>
        <v-slide-group-item v-for="cat in categories" :key="cat">
          <v-chip
            class="ma-2 font-weight-medium"
            :color="store.activeCategory === cat ? 'white' : 'surface-variant'"
            :variant="store.activeCategory === cat ? 'elevated' : 'flat'"
            link
            @click="selectCategory(cat)"
          >
            <v-icon v-if="cat === 'Histórico'" start size="small"
              >mdi-history</v-icon
            >
            {{ cat }}
          </v-chip>
        </v-slide-group-item>
      </v-slide-group>

      <!-- Grid de Resultados -->
      <v-row v-if="store.hasSearched" class="mt-4 px-md-4">
        <!-- Skeletons enquanto carrega pela primeira vez -->
        <template v-if="showInitialSkeletons">
          <v-col
            v-for="i in 12"
            :key="`skeleton-${i}`"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-skeleton-loader
              type="image, list-item-avatar-two-line"
              color="transparent"
            ></v-skeleton-loader>
          </v-col>
        </template>

        <!-- Vídeos Filtrados -->
        <template v-else>
          <!-- Modo ABA SHORTS: Mostrar Shorts em Grid Limpo -->
          <template v-if="store.activeCategory === 'Shorts'">
            <v-col
              v-for="video in shortVideos"
              :key="`shorts-grid-${video.id.videoId}`"
              cols="12"
              sm="4"
              md="3"
              lg="2"
              xl="2"
              class="d-flex justify-center"
            >
              <ShortVideoCard :video="video" />
            </v-col>
          </template>

          <template v-else>
            <!-- Bloco 1: Primeiros 4 vídeos Normais -->
            <v-col
              v-for="video in normalVideos.slice(0, 4)"
              :key="`n1-${video.id.videoId}`"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
            >
              <VideoCard :video="video" />
            </v-col>

            <!-- Bloco 2: Carrossel de Shorts (Prateleira de Breakpoint 100% de largura) -->
            <v-col
              cols="12"
              v-if="shortVideos.length > 0 && store.activeCategory === 'Tudo'"
              class="py-6 px-0 pa-sm-3"
            >
              <div class="d-flex align-center mb-4 px-2">
                <v-icon color="red" size="x-large" class="mr-2"
                  >mdi-play-box-multiple</v-icon
                >
                <h2 class="text-h5 font-weight-bold">Shorts</h2>
              </div>

              <v-slide-group show-arrows>
                <v-slide-group-item
                  v-for="video in shortVideos"
                  :key="`s-${video.id.videoId}`"
                >
                  <!-- Nosso novo componente com Aspect Ratio vertical -->
                  <ShortVideoCard :video="video" />
                </v-slide-group-item>

                <!-- Botão Dinâmico "Carregar Mais Shorts (Paginação com Token Independente)" -->
                <v-slide-group-item>
                  <div
                    class="d-flex align-center justify-center mx-2"
                    style="width: 160px"
                  >
                    <v-btn
                      variant="tonal"
                      color="grey-darken-1"
                      height="96%"
                      width="100%"
                      rounded="lg"
                      @click="store.loadMoreShorts()"
                      :loading="store.isShortsLoading"
                    >
                      <div class="d-flex flex-column align-center py-4">
                        <v-icon size="x-large" class="mb-2"
                          >mdi-chevron-right-circle-outline</v-icon
                        >
                        <span class="text-caption text-wrap"
                          >Mostrar<br />Mais</span
                        >
                      </div>
                    </v-btn>
                  </div>
                </v-slide-group-item>
              </v-slide-group>

              <v-divider class="mt-8 mb-2 border-opacity-25"></v-divider>
            </v-col>

            <!-- Bloco 3: Restante dos Vídeos Normais da paginação -->
            <v-col
              v-for="video in normalVideos.slice(4)"
              :key="`n2-${video.id.videoId}`"
              cols="12"
              sm="6"
              md="4"
              lg="3"
              xl="2"
            >
              <VideoCard :video="video" />
            </v-col>
          </template>
        </template>

        <!-- Empty State (Sem resultados) -->
        <v-col
          v-if="
            !store.isLoading &&
            store.videos.length === 0 &&
            store.shortVideos.length === 0 &&
            !store.errorMessage
          "
          cols="12"
          class="text-center py-10"
        >
          <v-icon size="64" color="grey-darken-1"
            >mdi-movie-search-outline</v-icon
          >
          <h2 class="text-h6 mt-4 text-grey-lighten-1">
            Nenhum vídeo encontrado para "{{ store.searchQuery }}"
          </h2>
          <p class="text-body-2 text-grey-darken-1">
            Tente pesquisar com palavras-chave diferentes.
          </p>
        </v-col>
      </v-row>

      <!-- Paginação / Carregar Mais -->
      <div
        v-if="
          canLoadMore &&
          (store.videos.length > 0 || store.shortVideos.length > 0)
        "
        class="d-flex justify-center mt-8 mb-4"
      >
        <v-btn
          @click="loadMore"
          :loading="store.isLoading"
          variant="tonal"
          color="primary"
          rounded="pill"
          size="large"
          prepend-icon="mdi-chevron-down"
        >
          Carregar Mais
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
/* O container fill-height com align-start garante que o conteúdo não fique verticalmente centralizado de forna artificial após a busca */
</style>
