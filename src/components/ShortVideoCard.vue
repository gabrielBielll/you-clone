<script setup lang="ts">
import { useRouter } from "vue-router";
import type { YouTubeSearchItem } from "../types/youtube";

import { useYoutubeStore } from "../stores/useYoutubeStore";

const props = defineProps<{
  video: YouTubeSearchItem;
}>();

const router = useRouter();
const store = useYoutubeStore();

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
    class="short-video-card cursor-pointer bg-transparent mx-2"
    elevation="0"
    width="160"
    @click="goToVideo"
    rounded="lg"
  >
    <div class="thumbnail-wrapper position-relative">
      <!-- Short style uses 9/16 Vertical Aspect Ratio. We use 'cover' to crop perfectly -->
      <v-img
        :src="
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.medium?.url ||
          video.snippet.thumbnails.default?.url
        "
        class="rounded-lg thumbnail-img bg-surface-variant"
        cover
        height="284"
        :aspect-ratio="9 / 16"
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

      <div class="views-badge text-white text-caption font-weight-medium px-1">
        <v-icon size="small" class="mr-1">mdi-play-outline</v-icon>Shorts
      </div>
    </div>

    <v-card-item class="pt-2 px-0 pb-0">
      <v-card-title
        class="text-subtitle-2 font-weight-bold lh-sm mb-1 text-wrap title-clamp pt-0"
      >
        <span v-html="video.snippet.title"></span>
      </v-card-title>
      <v-card-subtitle class="text-caption text-grey-lighten-1 pb-1">
        {{ video.snippet.channelTitle }}
      </v-card-subtitle>
    </v-card-item>
  </v-card>
</template>

<style scoped>
.short-video-card {
  transition: transform 0.2s ease-in-out;
}
.short-video-card:hover {
  transform: scale(1.02);
}
.thumbnail-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}
.views-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
}
.title-clamp {
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
