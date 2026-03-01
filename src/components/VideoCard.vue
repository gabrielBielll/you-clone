<script setup lang="ts">
import { useRouter } from "vue-router";
import { useYoutubeStore } from "../stores/useYoutubeStore";
import type { YouTubeSearchItem } from "../types/youtube";

const props = defineProps<{
  video: YouTubeSearchItem;
}>();

const router = useRouter();
const store = useYoutubeStore();

// Helper to format Date
const formatDate = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day",
  );
};

const goToVideo = () => {
  if (props.video?.id?.videoId) {
    store.addToHistory(props.video as any);
    router.push({
      name: "video-detail",
      params: { id: props.video.id.videoId },
    });
  }
};
</script>

<template>
  <v-card
    class="video-card mx-auto cursor-pointer bg-transparent"
    elevation="0"
    @click="goToVideo"
    rounded="lg"
  >
    <!-- Thumbnail and Duration Overlay -->
    <div class="thumbnail-wrapper position-relative">
      <v-img
        :src="video.snippet.thumbnails.medium.url"
        class="rounded-lg thumbnail-img bg-surface-variant"
        cover
        aspect-ratio="16/9"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular
              color="grey-lighten-4"
              indeterminate
            ></v-progress-circular>
          </div>
        </template>
      </v-img>

      <!-- Duration Badge: Only shows if video.duration exists (loaded via Batch) -->
      <div
        v-if="video.duration"
        class="duration-badge bg-black text-white text-caption font-weight-medium px-1 rounded"
      >
        {{ video.duration }}
      </div>
    </div>

    <v-card-item class="pt-3 px-0 pb-0">
      <v-row density="compact">
        <v-col cols="auto" class="pr-3">
          <v-avatar color="primary" size="36">
            {{ video.snippet.channelTitle.charAt(0).toUpperCase() }}
          </v-avatar>
        </v-col>
        <v-col>
          <v-card-title
            class="text-subtitle-1 font-weight-bold lh-sm mb-1 text-wrap title-clamp"
          >
            <!-- Ensure decoding HTML entities for titles returned by Youtube API (eg: &#39; -> ') -->
            <span v-html="video.snippet.title"></span>
          </v-card-title>
          <v-card-subtitle class="text-caption text-grey-lighten-1">
            {{ video.snippet.channelTitle }}
            <br />
            Postado {{ formatDate(video.snippet.publishedAt) }}
          </v-card-subtitle>
        </v-col>
      </v-row>
    </v-card-item>
  </v-card>
</template>

<style scoped>
.video-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
}
.video-card:hover {
  transform: scale(1.02);
}
.thumbnail-wrapper {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}
.title-clamp {
  /* Clamping title to 2 lines MAX */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.2rem;
  min-height: 2.4rem;
}
</style>
<style scoped>
.video-card {
  transition: transform 0.2s;
}
.video-card:hover {
  transform: scale(1.02);
}
.thumbnail-img {
  width: 100%;
}
.text-caption {
  line-height: 1.2;
}

/* Timestamp Duration Badge styles */
.thumbnail-wrapper {
  position: relative;
}
.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  opacity: 0.9;
  letter-spacing: 0.5px;
}
</style>
