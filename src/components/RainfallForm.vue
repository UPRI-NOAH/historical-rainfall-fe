<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import {
  CheckboxIndicator,
  CheckboxRoot,
  CheckboxGroupRoot,
} from "reka-ui";
import "@vuepic/vue-datepicker/dist/main.css";
import FileTable from "./FileTable.vue";
import type { MapImage } from "../types";
import { generation } from "../store";
import { Download } from 'lucide-vue-next'
import '../style.css'

const props = defineProps<{
  files: MapImage[];
  generatingImage: boolean;
  selectedImage?: MapImage | null;
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
  const res = hours.filter((val) => lengthOfInterval.value % val == 0);
  console.log(res);
  return res;
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
              class="hover:bg-stone-50 flex h-5 w-5 appearance-none items-center cursor-pointer justify-center rounded-md bg-white shadow-sm border border-[#c2c2c2] outline-none"
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
        <h3 class="text-black">Accumulation Period</h3>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />

        <div class="flex justify-between w-full">
          <button
            v-for="period in [1, 3, 6, 12, 24]"
            :key="period"
            type="button"
            class="flex  items-center gap-2"
            :disabled="!canGenerate || lengthOfInterval % period !== 0"
            @click="frequencyIdx = [[1, 3, 6, 12, 24].indexOf(period)]"
          >
            <div
              class="w-5 h-5 rounded-full border-1 border-[#C2C2C2] cursor-pointer shadow-sm peer-checked:border-blue-600 peer-checked:bg-blue-600 transition"
              :class="[
                !canGenerate || lengthOfInterval % period !== 0
                  ? 'border-gray-300 bg-gray-200'
                  : frequency === period
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-500 bg-white'
              ]"
            />

            <span
              class="text-sm"
              :class="!canGenerate || lengthOfInterval % period !== 0
                ? 'text-gray-400'
                : 'text-black'"
            >
              {{ period }}h
            </span>
          </button>
        </div>

        <div class="flex flex-col items-start">
          Maps To Generate: {{ frequency ? lengthOfInterval / frequency : "-" }}
        </div>
      </div>

      <div class="w-full flex flex-col items-center gap-2">
        <div
          class="w-full overflow-hidden transition-all duration-300 ease-in-out"
          :class="
            generatingImage
              ? 'max-h-16 opacity-100 mb-2'
              : 'max-h-0 opacity-0 mb-0'
          "
        >
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <Transition name="fade-up" mode="out-in">
              <span :key="generation.status ?? 'unknown'">
                {{ generation.status }}
              </span>
            </Transition>
            <span class="text-[0.75rem]">
              {{ generation.status_code !== 4 ? `${generation.progress}%` : "" }}
            </span>
          </div>

          <div class="relative h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              class="progress-fill h-full rounded-full bg-blue-600 transition-all duration-300 ease-linear"
              :style="{ width: `${generation.status_code !== 4 ? generation.progress : 0}%` }"
            >
              <div class="progress-shimmer"></div>
            </div>
          </div>
        </div>

        <button
          class="w-full flex items-center justify-center gap-2 text-center text-[0.8rem] font-bold rounded border-none transition-all duration-300 hover:brightness-90 hover:cursor-pointer py-0.5 disabled:bg-[#a0a0a0] disabled:cursor-not-allowed disabled:hover:brightness-100 relative overflow-hidden"
          :class="
            generatingImage
              ? 'bg-gray-100 text-gray-600 border-3 border-[#C2C2C2]'
              : 'bg-[#1F57FF] text-white'
          "
          @click="
            generatingImage
              ? emit('cancelGenerate')
              : handleGenerateImage(dates!, sources, frequency!)
          "
          :disabled="!generatingImage && !canGenerate"
        >
          {{ generatingImage ? "Cancel" : "Generate Contour Maps" }}
        </button>
      </div>

      <div class="w-full flex flex-col items-start gap-2 max-w-inherit">
        <div class="w-full flex items-center justify-between mb-2">
          <h3 class="text-black">Latest Generated Contour Maps</h3>
          <button
            class="p-1 rounded transition text-gray-500 enabled:hover enabled:hover:cursor-pointer bg-gray-100 enabled:hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canDownloadZip"
            @click="emit('downloadZip')"
            title="Download ZIP"
          >
            <Download :size="16" />
          </button>
        </div>
        <div class="w-full h-[1px] bg-[#c2c2c2]" />
        <FileTable
          :files="files"
          :selected-image="selectedImage"
          @image-selected="emit('imageSelected', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style>
.dp {
  --dp-font-size: 0.8rem;
}
</style>
