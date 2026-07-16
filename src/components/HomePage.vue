<script setup lang="ts">
import {
  watch,
  defineProps,
  defineEmits,
  onMounted,
  onBeforeUnmount,
  shallowRef,
  ref,
} from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import type { MapImage } from "../types";
import type { Feature, Polygon } from "geojson";

const props = defineProps<{
  contour: MapImage | null;
}>();

const emit = defineEmits<{
  (e: "bounds-change", bounds: Feature<Polygon> | null): void;
}>();

const map = shallowRef<L.Map>();
const currentOverlay = ref<L.ImageOverlay | null>(null);

onMounted(() => {
  map.value = L.map("map", { zoomControl: false }).setView(
    [12.8797, 121.774],
    6
  );

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri" }
  ).addTo(map.value);

  L.control
    .zoom({
      position: "bottomright",
    })
    .addTo(map.value);

  const drawnItems = new L.FeatureGroup();
  map.value.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    position: "topright",
    draw: {
      rectangle: false,
      polygon: true,
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
    },
    edit: {
      featureGroup: drawnItems,
    },
  });

  map.value.addControl(drawControl);

  map.value.on(L.Draw.Event.CREATED, (e: any) => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);

    emit("bounds-change", e.layer.toGeoJSON());
  });

  map.value.on(L.Draw.Event.DELETED, () => {
    if (drawnItems.getLayers().length === 0) {
      emit("bounds-change", null);
    }
  });

  map.value.on(L.Draw.Event.EDITED, (e: any) => {
    const layer = e.layers.getLayers()[0];
    emit("bounds-change", layer ? layer.toGeoJSON() : null);
  });
});

watch(
  () => props.contour,
  (newContour: MapImage | null) => {
    if (newContour == null) return;
    if (map.value == null) return;

    if (currentOverlay.value) {
      currentOverlay.value.setUrl(newContour.url);
      currentOverlay.value.setBounds(newContour.boundingPolygon);
    } else {
      currentOverlay.value = L.imageOverlay(
        newContour.url,
        newContour.boundingPolygon,
        {
          opacity: 0.7,
        }
      ).addTo(map.value!);
    }
  }
);

onBeforeUnmount(() => {
  map.value?.remove();
});
</script>

<template>
  <div id="map"></div>
</template>

<style scoped>
#map {
  height: 100vh;
  width: 100vw;
}
</style>
