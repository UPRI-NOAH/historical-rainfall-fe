<script setup lang="ts">
import { defineProps } from "vue";
import { format } from "date-fns";
import type { MapImage } from "../types";

const props = defineProps<{
  files: MapImage[];
}>();
</script>

<template>
  <div class="w-full h-fit flex flex-col p-[0.2rem] max-w-inherit">
    <div
      class="w-full grid grid-cols-[1fr_0.5fr_0.5fr_1fr] gap-2 border-b-[1px] border-b-solid border-[#c2c2c2]"
    >
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
        class="w-full grid grid-cols-[1fr_0.5fr_0.5fr_1fr] gap-2 text-[0.8rem] text-left hover:brightness-50 hover:cursor-pointer"
        @click="$emit('imageSelected', file)"
        :title="file.filename"
      >
        <span class="min-w-0 truncate">{{ file.filename }}</span>
        <span class="min-w-0 truncate">{{ file.size }} KB</span>
        <span class="min-w-0 truncate">{{ file.durationHours }} hr</span>
        <span class="min-w-0 truncate">{{
          format(file.timestamp, "yyyy/MM/dd HH:mm")
        }}</span>
      </div>
    </div>
  </div>
</template>
