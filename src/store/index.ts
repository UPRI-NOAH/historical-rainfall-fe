import { reactive } from "vue";

export const generation = reactive<{
  workflow_id: string | null;
  status: null | string;
  progress: number;
}>({
  workflow_id: null,
  status: null,
  progress: 0,
});
