import { reactive } from "vue";

export const generation = reactive<{
  status: null | string;
  progress: number;
}>({
  status: null,
  progress: 0,
});
