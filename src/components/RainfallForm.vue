<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from "vue";
import { Icon } from "@iconify/vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { CheckboxIndicator, CheckboxRoot, CheckboxGroupRoot } from "reka-ui";
import "@vuepic/vue-datepicker/dist/main.css";
import FileTable from "./FileTable.vue";
import type { MapImage } from "../types";

const props = defineProps<{
  files: MapImage[];
  generatingImage: boolean;
}>();
const emit = defineEmits<{
  (
    e: "generateImage",
    startDate: Date,
    endDate: Date,
    sources: string[],
    hours: string[]
  ): void;
  (e: "imageSelected", image: MapImage): void;
  (e: "cancelGenerate"): void;
  (e: "downloadZip"): void;
}>();

const dates = ref();
const sources = ref([]);
const durations = ref([]);
const expanded = ref(false); // mobile bottom-sheet open/closed state

function handleGenerateImage(
  dates: Date[],
  sources: string[],
  hours: string[]
) {
  const startDate = dates[0];
  const endDate = dates[1];
  emit("generateImage", startDate, endDate, sources, hours);
}

const canGenerate = computed(() => {
  return (
    dates.value != null &&
    dates.value.length == 2 &&
    sources.value.length > 0 &&
    durations.value.length > 0
  );
});

const canDownloadZip = computed(() => {
  return props.files !== null && props.files.length > 0;
});
</script>

<template>
  <div
    class="fixed sm:absolute bottom-0 left-0 right-0 sm:right-auto sm:top-5 sm:left-5 sm:bottom-auto bg-[#f0f0f0] z-1000 rounded-t-xl sm:rounded-md border-2 border-solid border-[#c2c2c2] px-[25px] sm:py-[20px] flex flex-col items-start gap-5 transition-all duration-300 ease-in-out w-full sm:w-fit sm:h-fit sm:max-w-[35rem]"
    :class="expanded ? 'py-[20px]' : 'py-[8px]'"
  >
    <!-- mobile-only toggle handle -->
    <button
      class="sm:hidden w-full flex justify-center items-center h-[18px]"
      @click="expanded = !expanded"
    >
      <Icon
        icon="radix-icons:chevron-up"
        class="h-4 w-4 text-[#555] transition-transform duration-300"
        :class="expanded ? 'rotate-180' : 'rotate-0'"
      />
    </button>

    <!-- collapsible content: always visible on sm+, toggled on mobile -->
    <div
      class="w-full flex flex-col items-start justify-start gap-5 sm:!flex overflow-hidden transition-all duration-300"
      :class="
        expanded
          ? 'max-h-[2000px] opacity-100'
          : 'max-h-0 opacity-0 sm:max-h-none sm:opacity-100'
      "
    >
      <div class="w-full flex flex-col items-start gap-2">
        <h3 class="text-black">Date & Time</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <div class="w-full datepicker">
          <VueDatePicker v-model="dates" class="dp" range />
        </div>
      </div>

      <div class="w-full flex flex-col items-start gap-2">
        <h3 class="text-black">Sources</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <CheckboxGroupRoot
          v-model="sources"
          class="w-full flex flex-row items-start gap-7 text-[0.8rem]"
        >
          <div
            v-for="source in ['jaxa', 'pagasa', 'pagasa-pmt']"
            class="flex flex-row gap-2 items-center"
          >
            <CheckboxRoot
              :value="source"
              class="hover:bg-stone-50 flex h-5 w-5 appearance-none items-center justify-center rounded-md bg-white shadow-sm border border-[#c2c2c2] outline-none"
            >
              <CheckboxIndicator
                class="bg-[#1F57FF] h-full w-full rounded flex items-center justify-center"
              >
                <Icon
                  icon="radix-icons:check"
                  class="h-5 w-5 text-white rounded"
                />
              </CheckboxIndicator>
            </CheckboxRoot>
            <span class="uppercase">{{ source }}</span>
          </div>
        </CheckboxGroupRoot>
      </div>

      <div class="w-full flex flex-col items-start gap-2">
        <h3 class="text-black">Duration</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <CheckboxGroupRoot
          v-model="durations"
          class="w-full flex flex-row items-start gap-7 text-[0.8rem]"
        >
          <div
            v-for="duration in ['1', '3', '6', '12', '24']"
            class="flex flex-row gap-2 items-center"
          >
            <CheckboxRoot
              :value="duration"
              class="hover:bg-stone-50 flex h-5 w-5 appearance-none items-center justify-center rounded-md bg-white shadow-sm border border-[#c2c2c2] outline-none"
            >
              <CheckboxIndicator
                class="bg-[#1F57FF] h-full w-full rounded flex items-center justify-center"
              >
                <Icon
                  icon="radix-icons:check"
                  class="h-5 w-5 text-white rounded"
                />
              </CheckboxIndicator>
            </CheckboxRoot>
            <span>{{ duration }} hr</span>
          </div>
        </CheckboxGroupRoot>
      </div>

      <button
        class="w-full flex items-center justify-center gap-2 text-center text-[0.8rem] text-white font-bold rounded border-none transition hover:brightness-90 hover:cursor-pointer py-0.5 disabled:bg-[#a0a0a0] disabled:cursor-not-allowed disabled:hover:brightness-100"
        :class="generatingImage ? 'bg-[#E23B3B]' : 'bg-[#1F57FF]'"
        @click="
          generatingImage
            ? emit('cancelGenerate')
            : handleGenerateImage(dates, sources, durations)
        "
        :disabled="!generatingImage && !canGenerate"
      >
        <Icon
          v-if="generatingImage"
          icon="radix-icons:reload"
          class="h-4 w-4 animate-spin"
        />
        {{ generatingImage ? "Cancel" : "Generate Images" }}
      </button>

      <div class="w-full flex flex-col items-start gap-2 max-w-inherit">
        <h3 class="text-black">Last Generated Images</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <FileTable
          :files="files"
          @image-selected="emit('imageSelected', $event)"
        />
      </div>

      <button
        class="w-full text-center bg-[#1F57FF] text-[0.8rem] text-white font-bold rounded border-none transition hover:brightness-90 hover:cursor-pointer mb-[20px] sm:mb-0 py-0.5 disabled:bg-[#a0a0a0] disabled:cursor-not-allowed disabled:hover:brightness-100"
        :disabled="!canDownloadZip"
        @click="emit('downloadZip')"
      >
        Download .zip
      </button>
    </div>
  </div>
</template>

<style>
.dp {
  --dp-font-size: 0.8rem;
}
</style>
