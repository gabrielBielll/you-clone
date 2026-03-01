<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useYoutubeStore } from "../stores/useYoutubeStore";
import VideoComments from "../components/VideoComments.vue";

const route = useRoute();
const router = useRouter();
const store = useYoutubeStore();

const videoId = route.params.id as string;
const showFullDescription = ref(false);

onMounted(() => {
  store.loadVideoDetail(videoId);
});

const goBack = () => {
  // Como as buscas estão salvas no Pinia,
  // voltar simplesmente vai exibir o componente re-renderizado
  // com os mesmos arrays e scroll de antes graças ao Keep-Alive do App.vue
  router.push({ name: "home" });
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Formatação estilo Youtube: 1.5 mi, 400 mil, etc
const formatCompactNumber = (num?: string | number) => {
  if (!num) return "0";
  return Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(num));
};

const video = computed(() => store.currentVideoDetail);

const formattedDescription = computed(() => {
  if (!video.value?.snippet.description) return "";
  // Converter quebras de linha em tags <br> para manter o visual nativo do YT
  return video.value.snippet.description.replace(/\n/g, "<br>");
});
</script>

<template>
  <v-container fluid class="pa-4 bg-background fill-height align-start">
    <!-- Header with Back Button -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex align-center">
        <v-btn
          icon="mdi-arrow-left"
          variant="tonal"
          color="white"
          @click="goBack"
          class="mr-4"
        ></v-btn>
        <div class="text-h6 font-weight-bold">Voltar para busca</div>
      </v-col>
    </v-row>

    <!-- Loading Skeleton -->
    <v-row v-if="store.isLoading || (!video && !store.errorMessage)">
      <v-col cols="12" md="8" offset-md="2">
        <v-skeleton-loader type="image"></v-skeleton-loader>
        <v-skeleton-loader
          type="heading, paragraph"
          class="mt-4"
        ></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-alert
      v-else-if="store.errorMessage"
      type="error"
      variant="tonal"
      class="mb-6 mx-auto w-100"
      max-width="800"
    >
      {{ store.errorMessage }}
    </v-alert>

    <!-- Video Details Content -->
    <v-row v-else-if="video">
      <v-col cols="12" lg="8" offset-lg="2" xl="8" offset-xl="2">
        <!-- Iframe Player - Proporção 16:9 forçada -->
        <div
          class="video-player-container bg-black elevation-10 rounded-lg overflow-hidden"
        >
          <iframe
            :src="`https://www.youtube.com/embed/${videoId}?autoplay=1`"
            frameborder="0"
            allow="
              accelerometer;
              autoplay;
              clipboard-write;
              encrypted-media;
              gyroscope;
              picture-in-picture;
            "
            allowfullscreen
            class="w-100 h-100 player-iframe"
          ></iframe>
        </div>

        <!-- Video Title -->
        <h1
          class="text-h5 font-weight-bold mt-4 mb-2 text-wrap"
          v-html="video.snippet.title"
        ></h1>

        <!-- Channel & Actions Toolbar -->
        <div
          class="d-flex flex-wrap align-center justify-space-between mb-4 mt-2 gap-4"
        >
          <div class="d-flex align-center channel-info">
            <v-avatar color="primary" size="40" class="mr-3">
              {{ video.snippet.channelTitle.charAt(0).toUpperCase() }}
            </v-avatar>
            <div class="text-subtitle-1 font-weight-bold">
              {{ video.snippet.channelTitle }}
            </div>
          </div>

          <div class="actions-group d-flex align-center">
            <div
              class="like-dislike-group d-flex align-center rounded-pill bg-surface-variant px-1 py-1 mr-2"
            >
              <!-- Botão Like Real -->
              <v-btn
                variant="text"
                rounded="pill"
                size="small"
                prepend-icon="mdi-thumb-up-outline"
              >
                <span class="font-weight-bold ml-1">{{
                  formatCompactNumber(video.statistics.likeCount)
                }}</span>
              </v-btn>

              <v-divider vertical class="mx-1 my-2"></v-divider>

              <!-- Botão Dislike Mockado (a pedido do usuário) -->
              <v-btn
                variant="text"
                rounded="pill"
                size="small"
                icon="mdi-thumb-down-outline"
              >
              </v-btn>
            </div>

            <v-btn
              variant="tonal"
              rounded="pill"
              prepend-icon="mdi-share-outline"
              class="mr-2 text-capitalize"
            >
              Compartilhar
            </v-btn>
          </div>
        </div>

        <!-- Reusable Video Description Box -->
        <v-card
          color="surface-variant"
          variant="flat"
          class="rounded-xl pa-4 description-card cursor-pointer"
          @click="showFullDescription = !showFullDescription"
        >
          <div class="font-weight-bold mb-2">
            {{ formatCompactNumber(video.statistics.viewCount) }} visualizações
            • {{ formatDate(video.snippet.publishedAt) }}
          </div>
          <div
            class="text-body-2 description-content text-grey-lighten-1"
            :class="{ collapsed: !showFullDescription }"
            v-html="formattedDescription"
          ></div>
          <div class="text-primary font-weight-bold mt-2 text-caption">
            {{ showFullDescription ? "Mostrar menos" : "Mostrar mais" }}
          </div>
        </v-card>

        <v-divider class="my-6"></v-divider>

        <!-- Video Comments List (Isolated Component) -->
        <VideoComments :videoId="videoId" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.video-player-container {
  /* 16:9 Aspect Ratio Setup */
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 = 9/16 = 0.5625 */
}

.player-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.description-card {
  transition: background-color 0.2s ease;
}
.description-card:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.description-content.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gap-4 {
  gap: 16px;
}
</style>
