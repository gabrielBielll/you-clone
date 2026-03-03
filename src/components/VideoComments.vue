<script setup lang="ts">
import { ref, onMounted } from "vue";
import { container } from "../di";
import type { YouTubeCommentItem } from "../types/youtube";

const props = defineProps<{
  videoId: string;
}>();

const comments = ref<YouTubeCommentItem[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
// Vamos adicionar uma trait apenas para caso a cota exceda, mostramos uma msg bonita
// ou avisemos "Comentários desativados"
const isDisabled = ref(false);

const loadComments = async () => {
  isLoading.value = true;
  errorMessage.value = null;
  isDisabled.value = false;

  try {
    const data = await container.youtubeRepository.getVideoComments(props.videoId);
    comments.value = data.items || [];
  } catch (error: any) {
    const { status, data } = error.response || {};

    // HTTP 403 / comments disabled is highly typical from Google APIs when a user sets video to "Made for Kids" or disables comments entirely.
    if (
      status === 403 &&
      data?.error?.errors?.[0]?.reason === "commentsDisabled"
    ) {
      isDisabled.value = true;
    } else {
      errorMessage.value =
        data?.error?.message ||
        "Erro ao carregar os comentários. Talvez a Cota Diária da API grátis acabou!";
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadComments();
});

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
};

const formatCompactNumber = (num: number) => {
  if (!num) return "";
  return Intl.NumberFormat("pt-BR", {
    notation: "compact",
  }).format(num);
};
</script>

<template>
  <div class="video-comments-container mt-8">
    <div class="text-h6 font-weight-bold mb-4">Comentários</div>

    <!-- Skeletons Loading -->
    <template v-if="isLoading">
      <v-skeleton-loader
        v-for="i in 3"
        :key="i"
        type="list-item-avatar-three-line"
        color="transparent"
        class="mb-2"
      ></v-skeleton-loader>
    </template>

    <!-- Error State (Generic) -->
    <v-alert
      v-else-if="errorMessage"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <v-icon start>mdi-alert-circle</v-icon>
      {{ errorMessage }}
    </v-alert>

    <!-- Error State (Disabled Comments) -->
    <v-alert
      v-else-if="isDisabled"
      type="info"
      variant="text"
      class="mb-4 text-center text-grey-lighten-1"
    >
      Os comentários estão desativados para este vídeo.
    </v-alert>

    <!-- Empty State -->
    <v-card
      v-else-if="comments.length === 0"
      variant="flat"
      color="transparent"
      class="text-center py-6"
    >
      <div class="text-body-1 text-grey-lighten-1">
        Ainda não há comentários.
      </div>
    </v-card>

    <!-- Comments List -->
    <v-list v-else bg-color="transparent" class="pa-0">
      <v-list-item
        v-for="comment in comments"
        :key="comment.id"
        class="pa-0 mb-6 align-start"
      >
        <template v-slot:prepend>
          <v-avatar size="40" class="mr-3 mt-1">
            <v-img
              :src="
                comment.snippet.topLevelComment.snippet.authorProfileImageUrl
              "
            ></v-img>
          </v-avatar>
        </template>

        <v-list-item-title class="font-weight-medium text-body-2 mb-1">
          {{ comment.snippet.topLevelComment.snippet.authorDisplayName }}
          <span class="text-grey-lighten-1 text-caption ml-2">
            {{
              formatDate(comment.snippet.topLevelComment.snippet.publishedAt)
            }}
          </span>
        </v-list-item-title>

        <div
          class="text-body-2 text-wrap mb-2 content-text"
          v-html="comment.snippet.topLevelComment.snippet.textDisplay"
        ></div>

        <!-- Like Row -->
        <div class="d-flex align-center text-grey-lighten-1">
          <v-btn
            icon="mdi-thumb-up-outline"
            size="x-small"
            variant="text"
            color="grey-lighten-1"
          ></v-btn>
          <span class="text-caption ml-1 font-weight-medium">
            {{
              formatCompactNumber(
                comment.snippet.topLevelComment.snippet.likeCount,
              )
            }}
          </span>
          <v-btn
            icon="mdi-thumb-down-outline"
            size="x-small"
            variant="text"
            color="grey-lighten-1"
            class="ml-4"
          ></v-btn>
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<style scoped>
.content-text {
  /* YouTube comment lines usually break freely and render <br> elements from the snippet directly */
  line-height: 1.4;
}
/* Adjust Vuetify v-list-item default min-height */
:deep(.v-list-item__content) {
  overflow: visible;
}
</style>
