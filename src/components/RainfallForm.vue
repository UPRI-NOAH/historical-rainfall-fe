<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from "vue";
import { Icon } from "@iconify/vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import {
  CheckboxIndicator,
  CheckboxRoot,
  CheckboxGroupRoot,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from "reka-ui";
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
    frequency: number
  ): void;
  (e: "imageSelected", image: MapImage): void;
  (e: "cancelGenerate"): void;
  (e: "downloadZip"): void;
}>();

const dates = ref<Date[]>();
const sources = ref<string[]>([]);
const frequencyIdx = ref<number[]>([0]);
const expanded = ref<boolean>(false); // mobile bottom-sheet open/closed state

function handleGenerateImage(
  dates: Date[],
  sources: string[],
  frequency: number
) {
  const startDate = dates[0];
  const endDate = dates[1];
  console.log("FREQ: ", frequency);
  emit("generateImage", startDate, endDate, sources, frequency);
}

const lengthOfInterval = computed(() => {
  if (
    dates.value &&
    dates.value[0] &&
    dates.value[1] &&
    dates.value.length == 2
  ) {
    const d0 = new Date(dates.value[0].getTime());
    const d1 = new Date(dates.value[1].getTime());
    d0.setMinutes(0, 0, 0);
    d1.setMinutes(0, 0, 0);

    const diffMs = Math.abs(d1.valueOf() - d0.valueOf());
    return diffMs / (1000 * 60 * 60);
  }

  return -1;
});

const frequencyOptions = computed(() => {
  if (lengthOfInterval.value <= 0) return [];
  const hours = [1, 3, 6, 12, 24];
  return hours.filter((val) => lengthOfInterval.value % val == 0);
});

const frequency = computed(() => {
  if (frequencyOptions.value.length > 0) {
    return frequencyOptions.value[frequencyIdx.value[0]];
  }

  return null;
});

const canGenerate = computed(() => {
  return (
    dates.value != null &&
    dates.value.length == 2 &&
    dates.value[0] &&
    dates.value[1] &&
    sources.value.length > 0 &&
    frequency.value
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
            v-for="source in [
              { label: 'JAXA', value: 'jaxa' },
              { label: 'PAGASA', value: 'pagasa' },
              { label: 'Pasig-Marikina-Tullahan', value: 'pmt' },
            ]"
            class="flex flex-row gap-2 items-center"
          >
            <CheckboxRoot
              :value="source.value"
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
            <span class="uppercase">{{ source.label }}</span>
          </div>
        </CheckboxGroupRoot>
      </div>

      <div class="w-full flex flex-col items-start gap-2">
        <h3 class="text-black">Frequency</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <SliderRoot
          v-model="frequencyIdx"
          class="relative flex items-center select-none touch-none w-full h-5"
          :max="frequencyOptions.length - 1"
          :step="1"
          :disabled="!(dates && dates.length == 2 && lengthOfInterval > 0)"
        >
          <SliderTrack class="bg-stone-500/30 relative grow rounded-full h-2">
            <SliderRange class="absolute bg-grass8 rounded-full h-full" />
          </SliderTrack>
          <SliderThumb
            class="block w-6 h-6 bg-white rounded-full hover:bg-stone-50 shadow-sm focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-grass9"
            aria-label="Volume"
          />
        </SliderRoot>
        <div class="flex flex-col items-start">
          <span> Hours Between: {{ lengthOfInterval }} </span>
          <span> Value: {{ frequency }} </span>
        </div>
      </div>

      <button
        class="w-full flex items-center justify-center gap-2 text-center text-[0.8rem] text-white font-bold rounded border-none transition hover:brightness-90 hover:cursor-pointer py-0.5 disabled:bg-[#a0a0a0] disabled:cursor-not-allowed disabled:hover:brightness-100"
        :class="generatingImage ? 'bg-[#E23B3B]' : 'bg-[#1F57FF]'"
        @click="
          generatingImage
            ? emit('cancelGenerate')
            : handleGenerateImage(dates, sources, frequency)
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
