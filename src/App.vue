<script setup lang="ts">
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useYoutubeStore } from "./stores/useYoutubeStore";

const { mobile } = useDisplay();
// No desktop começa recolhido (rail = true), no mobile começa escondido (drawer = false)
const drawer = ref(!mobile.value);
const rail = ref(true);

const router = useRouter();
const store = useYoutubeStore();

const toggleDrawer = () => {
  if (mobile.value) {
    drawer.value = !drawer.value;
  } else {
    rail.value = !rail.value;
  }
};

const forceCategory = async (category: string) => {
  if (mobile.value) drawer.value = false;
  if (router.currentRoute.value.name !== "home") {
    await router.push({ name: "home" });
  }
  store.search(store.searchQuery || "", category);
};

const openHistory = async () => {
  if (mobile.value) drawer.value = false;
  if (router.currentRoute.value.name !== "home") {
    await router.push({ name: "home" });
  }
  store.loadHistory();
};

const menuItems = [
  { title: "Início", icon: "mdi-home", action: () => forceCategory("Tudo") },
  {
    title: "Shorts",
    icon: "mdi-play-box-multiple",
    action: () => forceCategory("Shorts"),
  },
  { divider: true },
  { title: "Música", icon: "mdi-music", action: () => forceCategory("Música") },
  {
    title: "Ao Vivo",
    icon: "mdi-access-point",
    action: () => forceCategory("Ao Vivo"),
  },
  {
    title: "Esportes",
    icon: "mdi-trophy",
    action: () => forceCategory("Esportes"),
  },
  { divider: true },
  { title: "Histórico", icon: "mdi-history", action: () => openHistory() },
];
</script>

<template>
  <v-app class="app-bg">
    <!-- Navbar Superior -->
    <v-app-bar elevation="0" color="#0f0f0f" class="border-b-custom">
      <v-app-bar-nav-icon
        @click="toggleDrawer"
        class="ml-1"
      ></v-app-bar-nav-icon>

      <v-toolbar-title
        class="d-flex align-center font-weight-bold ml-2 cursor-pointer"
        @click="forceCategory('Tudo')"
      >
        <v-icon color="red" size="x-large" class="mr-1">mdi-youtube</v-icon>
        <span class="text-h6 font-weight-bold" style="letter-spacing: -0.5px"
          >YouTube</span
        >
      </v-toolbar-title>
    </v-app-bar>

    <!-- Sidebar / Drawer Lateral -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="!mobile && rail"
      :temporary="mobile"
      :permanent="!mobile"
      color="#0f0f0f"
      class="border-r-custom"
    >
      <v-list density="compact" nav class="pt-2">
        <template v-for="(item, i) in menuItems" :key="i">
          <v-divider
            v-if="item.divider"
            class="my-2 border-opacity-25"
          ></v-divider>
          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            class="rounded-lg mb-1"
            :active="
              store.activeCategory === item.title ||
              (item.title === 'Início' && store.activeCategory === 'Tudo')
            "
            active-color="white"
            @click="item.action"
          >
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view v-slot="{ Component }">
        <keep-alive include="HomeView">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </v-main>
  </v-app>
</template>

<style>
/* Estilos globais adicionais se necessário */
html,
body {
  background-color: #0f0f0f;
  color: white;
}
.app-bg {
  background-color: #0f0f0f !important;
}
.border-b-custom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.border-r-custom {
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}
/* Força a cor ativa nas listas para fundo sutil e barra de ícone claro */
.v-list-item--active {
  background-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
