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
        prepend-inner-icon="mdi-magnify"
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
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  /* Initial state: Center of the screen */
  height: 80vh;
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
  .search-form {
    padding: 0 16px;
  }
}
</style>
