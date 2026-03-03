<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  loading?: boolean;
  hasSearched?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "submit", value: string): void;
}>();

const localQuery = ref(props.modelValue);
const isFocused = ref(false);

// Sync modelValue changes with localQuery
watch(
  () => props.modelValue,
  (newVal) => {
    localQuery.value = newVal;
  },
);

const submitSearch = () => {
  if (localQuery.value && localQuery.value.trim().length > 0) {
    emit("submit", localQuery.value.trim());
  }
};

// Vuetify Rules
const rules = {
  required: (value: string | null) =>
    !!(value && value.trim()) || "Por favor, insira um termo para pesquisa.",
};
</script>

<template>
  <div class="search-container" :class="{ 'is-searched': hasSearched }">
    <!-- Hero Background Animation State -->
    <div class="hero-bg" v-if="!hasSearched"></div>
    <div class="hero-gradient" v-if="!hasSearched"></div>

    <!-- Hero Text inspired by Netflix -->
    <div v-if="!hasSearched" class="hero-text text-white text-center px-4">
      <h1
        class="text-h3 text-md-h2 font-weight-black mb-4 d-none d-sm-block"
        style="line-height: 1.2"
      >
        Vídeos, shorts e muito<br />mais, sem limites
      </h1>
      <h2 class="text-h6 text-md-h5 font-weight-regular mb-6">
        Assista quando quiser. Aprenda o que quiser.
      </h2>
      <p class="text-body-1 font-weight-medium mb-6">
        Quer assistir? Digite um termo de busca abaixo para iniciar.
      </p>
    </div>

    <v-form @submit.prevent="submitSearch" class="search-form">
      <v-text-field
        v-model="localQuery"
        @update:model-value="emit('update:modelValue', $event || '')"
        :rules="[rules.required]"
        :loading="loading"
        placeholder="Pesquisar"
        variant="outlined"
        rounded="pill"
        density="comfortable"
        bg-color="surface"
        append-inner-icon="mdi-microphone"
        class="search-input"
        hide-details="auto"
        @focus="isFocused = true"
        @blur="isFocused = false"
        clearable
        elevation="2"
      >
        <template v-slot:append>
          <v-btn
            icon="mdi-magnify"
            variant="flat"
            color="primary"
            class="search-btn"
            @click="submitSearch"
            :loading="loading"
            :disabled="!localQuery || !localQuery.trim()"
          ></v-btn>
        </template>
      </v-text-field>
    </v-form>
  </div>
</template>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  /* Initial state: Center of the screen */
  height: 80vh;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("../assets/hero_bg.png");
  background-size: cover;
  background-position: center;
  z-index: 0;
  opacity: 0.6;
  filter: blur(2px) contrast(1.1);
  transform: scale(1.05); /* Prevents blur bleeding edges */
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(18, 18, 18, 0.6) 0%,
    rgba(18, 18, 18, 0.2) 40%,
    rgba(18, 18, 18, 1) 100%
  );
  z-index: 1;
}

.hero-text {
  position: relative;
  z-index: 2;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
}

.search-container.is-searched {
  /* State after search: Top of the screen */
  height: auto;
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.search-form {
  width: 100%;
  max-width: 650px;
  position: relative;
  z-index: 2;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.search-input {
  /* Mimicking YouTube rounded clean search bar style */
  font-size: 16px;
}

.search-btn {
  margin-left: 8px;
  /* Rounding the button */
  border-radius: 50% !important;
  width: 48px !important;
  height: 48px !important;
}

@media (max-width: 600px) {
  .search-container:not(.is-searched) {
    /* Garante que o container use ocupe a tela toda no mobile */
    height: calc(100vh - 64px);
    display: block !important;
  }
  
  .search-container:not(.is-searched) .hero-text {
    position: absolute;
    /* Coloca o texto logo acima do meio da tela. Subimos mais 48px para compensar o v-main/padding */
    bottom: calc(50% + 40px + 48px);
    width: 100%;
    margin-bottom: 0;
  }

  .search-container:not(.is-searched) .search-form {
    position: absolute;
    top: 50%;
    left: 50%;
    /* Compensamos os 48px de deslocamento do header e padding do container */
    transform: translate(-50%, calc(-50% - 48px)) !important;
    width: 100%;
    padding: 0 16px;
    margin: 0 !important;
  }

  .search-container.is-searched .search-form {
    padding: 0 16px;
  }
}
</style>
