import { reactive } from "vue";

export const generation = reactive<{
  task_id: string | null;
  status: null | string;
  status_code: number;
  progress: number;
}>({
  task_id: null,
  status: null,
  status_code: 0,
  progress: 0,
});
