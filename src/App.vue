<script setup lang="ts">
import { ref, shallowRef } from "vue";
import HomePage from "./components/HomePage.vue";
import RainfallForm from "./components/RainfallForm.vue";
import { loadImages } from "./utils";
import { generation } from "./store";
import { cancelImages } from "./api/client";
import noahLogo from "./assets/noah-logo-high-res.png";
import type { MapImage } from "./types";
import type { Feature, Polygon } from "geojson";

const images = ref<MapImage[]>([]);
const zipBlob = shallowRef<Blob | null>(null);
const controller = shallowRef<AbortController>();
const selectedImage = ref<null | MapImage>(null);
const loading = ref(false);
const boundingPolygon = ref<Feature<Polygon> | null>(null);

function handleImageSelected(image: MapImage) {
  selectedImage.value = image;
}

function handleBoundsChange(val: Feature<Polygon> | null) {
  boundingPolygon.value = val;
}

async function handleGenerateImage(
  startDate: Date,
  endDate: Date,
  sources: string[],
  frequency: number
) {
  controller.value = new AbortController();
  loading.value = true;
  try {
    const result = await loadImages(
      boundingPolygon.value,
      startDate,
      endDate,
      sources,
      frequency,
      controller.value.signal
    );
    images.value = result.mapImages;
    zipBlob.value = result.zipBlob;

    selectedImage.value =
      result.mapImages.length > 0 ? result.mapImages[0] : null;

  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return;
    }
    throw e;
  } finally {
    loading.value = false;
  }
}

async function handleCancelGenerateImage() {
  if (!loading.value || !controller.value) return;

  // Snapshot the values we care about BEFORE any await —
  // so a concurrent generate() can't swap them out from under us
  const activeController = controller.value;
  const activeTaskId = generation.task_id;

  activeController.abort();

  if (activeTaskId) {
    await cancelImages(activeTaskId);
  }

  loading.value = true;
}

function handleDownloadZip() {
  if (!zipBlob.value) return;
  const url = URL.createObjectURL(zipBlob.value);
  const a = document.createElement("a");
  a.href = url;
  a.download = "rainfall_contours.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <RainfallForm
    :files="images"
    :generatingImage="loading"
    :selected-image="selectedImage"
    @image-selected="handleImageSelected"
    @generate-image="handleGenerateImage"
    @cancel-generate="handleCancelGenerateImage"
    @download-zip="handleDownloadZip"
  />
  <HomePage :contour="selectedImage" @bounds-change="handleBoundsChange" />
  <img
    :src="noahLogo"
    class="z-1000 absolute sm:bottom-[1rem] sm:top-auto top-[1rem] left-[1rem] h-[8rem]"
  />
</template>
