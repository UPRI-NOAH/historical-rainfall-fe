<script setup lang="ts">
import { format } from "date-fns";
import type { MapImage } from "../types";
import { Eye } from "lucide-vue-next";

const props = defineProps<{
  files: MapImage[];
  selectedImage?: MapImage | null;
}>();
</script>

<template>
  <div class="w-full h-fit flex flex-col p-[0.2rem] max-w-inherit">
    <div
      class="w-full grid grid-cols-[2rem_1fr_0.5fr_0.5fr_1fr] gap-2 border-b-[1px] border-b-solid border-[#c2c2c2]"
    >
      <span class="flex justify-center items-center translate-y-0.1">
        <Eye :size="14"/>
      </span>
      <span class="uppercase text-[#595858] text-[0.75rem] text-left">
        FILENAME
      </span>
      <span class="uppercase text-[#595858] text-[0.75rem] text-left">
        SIZE
      </span>
      <span class="uppercase text-[#595858] text-[0.75rem] text-left">
        DURATION
      </span>
      <span class="uppercase text-[#595858] text-[0.75rem] text-left">
        DATETIME
      </span>
    </div>
    <div class="max-h-[10rem] overflow-y-auto w-full">
      <div
        v-for="file in files"
        :key="file.filename"
        class="w-full grid grid-cols-[2rem_1fr_0.5fr_0.5fr_1fr] gap-2 items-center text-[0.8rem]"
      >
      <label class="flex items-center justify-center cursor-pointer">
          <input
            type="radio"
            name="selectedImage"
            :checked="selectedImage?.filename === file.filename"
            @change="$emit('imageSelected', file)"
            class="peer hidden shadow-sm"
          />

          <span
            class="
              w-4 h-4 rounded-full border-1
              border-[#C2C2C2]
              shadow-sm
              peer-checked:border-blue-600
              peer-checked:bg-blue-600
              transition
            "
          >
          </span>
        </label>
        <span class="truncate">{{ file.filename }}</span>
        <span>{{ file.size }} KB</span>
        <span>{{ file.durationHours }} hr</span>
        <span>{{ format(file.timestamp, "yyyy/MM/dd HH:mm") }}</span>
      </div>
      <div
        v-if="files.length === 0"
        class="w-full text-center text-xs text-gray-400 py-6"
      >
        No files to show
      </div>
    </div>
  </div>
</template>
