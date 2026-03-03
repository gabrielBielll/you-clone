<script setup lang="ts">
import { ref, computed, nextTick } from "vue";

const props = defineProps({
  modelValue: Boolean,
  videoInfo: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const messages = ref<{ role: string; text: string }[]>([]);
const userQuestion = ref("");
const isTyping = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const predefinedQuestions = [
  "Resuma o vídeo",
  "Recomende um conteúdo relacionado",
  "Quais são os principais pontos abordados?",
  "Para quem é este vídeo?",
];

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const askQuestion = async (question: string) => {
  if (!question.trim() || isTyping.value) return;

  messages.value.push({ role: "user", text: question });
  isTyping.value = true;
  userQuestion.value = "";
  scrollToBottom();

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    messages.value.push({
      role: "ai",
      text: "Chave de API do Gemini não configurada. Por favor, adicione a sua chave no arquivo .env como VITE_GEMINI_API_KEY=sua-chave para que eu possa funcionar corretamente!",
    });
    isTyping.value = false;
    scrollToBottom();
    return;
  }

  // Build the prompt context
  let context = `Você é a IA assistente do YouTube, chamada Gemini. Você está ajudando o usuário que está assistindo a um vídeo. Responda às perguntas dele com base nas informações do vídeo. Seja conciso e prestativo, agindo exatamente como o assistente nativo do aplicativo do YouTube. 
  
  DADOS DO VÍDEO:
  - Título: ${props.videoInfo.title}
  - Canal: ${props.videoInfo.channelTitle}
  - Descrição: ${props.videoInfo.description}
  
  PERGUNTA DO USUÁRIO: "${question}"`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }],
          generationConfig: {
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data = await response.json();
    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Desculpe, não consegui gerar uma resposta para esse vídeo.";

    messages.value.push({ role: "ai", text: answer });
  } catch (err: any) {
    messages.value.push({
      role: "ai",
      text: `Desculpe, ocorreu um erro ao consultar a IA. A chave VITE_GEMINI_API_KEY pode estar inválida ou sem as cotas ativas no Google AI Studio. Erro: ${err.message}`,
    });
  } finally {
    isTyping.value = false;
    scrollToBottom();
  }
};
</script>

<template>
  <v-bottom-sheet v-model="show" inset max-width="800">
    <v-card
      color="#121212"
      class="text-white rounded-t-xl overflow-hidden"
      height="75vh"
      rounded="xl"
    >
      <!-- Cabeçalho -->
      <div
        class="d-flex align-center justify-space-between pa-4 border-b-custom"
      >
        <span class="text-h6 font-weight-bold"
          >Faça perguntas sobre este vídeo</span
        >
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="show = false"
        ></v-btn>
      </div>

      <!-- Corpo Chat -->
      <v-card-text
        class="d-flex flex-column pa-0"
        style="height: calc(100% - 65px)"
      >
        <!-- Messages Area -->
        <div
          ref="messagesContainer"
          class="flex-grow-1 overflow-y-auto pa-4 d-flex flex-column messages-container"
          style="position: relative"
        >
          <!-- Default AI Welcome -->
          <div class="d-flex mb-6 align-start">
            <v-icon color="#a78ce6" size="24" class="mr-3">mdi-star-four-points</v-icon>
            <div>
              <p class="mb-3 text-body-1 text-grey-lighten-2 line-height-1-4">
                Olá! O conteúdo que você está assistindo despertou sua
                curiosidade? Estou aqui para ajudar.
              </p>
              <p class="text-body-1 text-grey-lighten-2 line-height-1-4 mb-2">
                Não sabe o que perguntar? Escolha algo:
              </p>
            </div>
          </div>

          <div
            v-if="messages.length === 0"
            class="d-flex flex-column mb-6 align-end w-100"
          >
            <v-btn
              v-for="(q, i) in predefinedQuestions"
              :key="i"
              variant="outlined"
              color="grey-darken-1"
              rounded="pill"
              class="text-none justify-start px-4 align-self-end mt-2 text-white bg-grey-darken-4 custom-chip"
              @click="askQuestion(q)"
            >
              {{ q }}
            </v-btn>
          </div>

          <!-- Chat Bubbles -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="d-flex w-100 mb-6"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <v-icon
              v-if="msg.role === 'ai'"
              color="#a78ce6"
              size="24"
              class="mr-3 mt-1 align-self-start flex-shrink-0"
            >
              mdi-star-four-points
            </v-icon>
            <div
              class="py-3 px-4 rounded-xl text-body-1 message-bubble"
              :class="
                msg.role === 'user'
                  ? 'bg-grey-darken-3 rounded-tr-sm'
                  : 'rounded-tl-sm text-grey-lighten-2 line-height-1-5'
              "
              style="max-width: 85%"
              v-html="
                msg.role === 'ai' ? msg.text.replace(/\n/g, '<br>') : msg.text
              "
            ></div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="d-flex mb-4 align-start">
            <v-icon color="#a78ce6" size="24" class="mr-3 mt-1"
              >mdi-star-four-points</v-icon
            >
            <div class="py-3 text-grey-lighten-1">Processando resposta...</div>
          </div>
        </div>

        <!-- Input Area Fixa Embaixo -->
        <div
          class="px-4 py-3 bg-grey-darken-4 mt-auto elevation-5 input-area-wrapper"
        >
          <v-text-field
            v-model="userQuestion"
            variant="solo-filled"
            bg-color="#2a2a2a"
            placeholder="Faça uma pergunta..."
            hide-details
            rounded="pill"
            density="comfortable"
            @keyup.enter="askQuestion(userQuestion)"
            class="custom-input"
          >
            <template v-slot:append-inner>
              <v-btn
                icon="mdi-send-outline"
                variant="text"
                size="small"
                color="white"
                :disabled="!userQuestion.trim() || isTyping"
                @click="askQuestion(userQuestion)"
              ></v-btn>
            </template>
          </v-text-field>
          <div
            class="text-caption text-center text-grey mt-2"
            style="font-size: 0.7rem !important"
          >
            A IA pode cometer erros. Por isso, é importante checar as respostas.
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.border-b-custom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.line-height-1-4 {
  line-height: 1.4 !important;
}
.line-height-1-5 {
  line-height: 1.5 !important;
}
.messages-container {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  padding-bottom: 20px !important;
}
.messages-container::-webkit-scrollbar {
  width: 6px;
}
.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
.custom-chip {
  border-color: rgba(255, 255, 255, 0.12) !important;
}
.custom-chip:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}
.input-area-wrapper {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.custom-input:deep(.v-field__input) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
.message-bubble {
  word-break: break-word;
}
</style>
