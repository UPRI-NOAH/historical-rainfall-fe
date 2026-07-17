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
import proj4 from "proj4";
window.proj4 = proj4; // Proj4Leaflet expects proj4 as a global
import "proj4leaflet";
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
const drawnItems = shallowRef(new L.FeatureGroup());

onMounted(() => {
  var my_EPSG_4326 = new L.Proj.CRS(
    "EPSG:4326",
    "+proj=longlat +datum=WGS84 +no_defs +type=crs",
    {
      origin: [-180, 90],
      resolutions: [
        0.5625,
        0.28125,
        0.140625,
        0.0703125,
        0.03515625,
        0.017578125,
        0.0087890625,
        0.00439453125,
        0.002197265625,
        0.0010986328125, // zoom 9
        0.00054931640625, // zoom 10
        0.000274658203125, // zoom 11
        0.0001373291015625, // zoom 12
        0.00006866455078125, // zoom 13
        0.000034332275390625, // zoom 14
        0.0000171661376953125, // zoom 15
        0.00000858306884765625, // zoom 16
      ],
      bounds: L.bounds(L.point(-180, -90), L.point(180, 90)),
    }
  );

  map.value = L.map("map", {
    crs: my_EPSG_4326,
    zoomControl: false,
  }).setView([2, 2], 2);

  L.tileLayer(
    `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/500m/{z}/{y}/{x}.jpg`,
    {
      noWrap: true,
      tileSize: 512,
      maxNativeZoom: 7, // real tiles only exist up to here
      maxZoom: 16, // let it zoom further, just reuses/upscales the z=8 tiles
      attribution: "Imagery © NASA EOSDIS GIBS / Blue Marble",
    }
  ).addTo(map.value);

  map.value.addLayer(drawnItems.value);

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
      featureGroup: drawnItems.value,
    },
  });

  map.value.addControl(drawControl);

  map.value.on(L.Draw.Event.CREATED, (e: any) => {
    drawnItems.value.clearLayers();
    drawnItems.value.addLayer(e.layer);

    emit("bounds-change", e.layer.toGeoJSON());
  });

  map.value.on(L.Draw.Event.DELETED, () => {
    if (drawnItems.value.getLayers().length === 0) {
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

function handleMapDrop(ev: DragEvent) {
  ev.preventDefault();
  const file = ev.dataTransfer.files[0];
  if (!file) return;

  const isGeoJSON =
    file.name.toLowerCase().endsWith(".geojson") ||
    file.name.toLowerCase().endsWith(".json") ||
    file.type === "application/geo+json" ||
    file.type === "application/json";

  if (!isGeoJSON) {
    console.warn(
      "Not recognized as GeoJSON by name/type, will still try to parse"
    );
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      const geoJsonLayer = L.geoJSON(data, {
        style: {
          color: "#3388ff",
          weight: 4,
          opacity: 0.5,
          fillColor: "#3388ff",
          fillOpacity: 0.2,
        },
      });

      const layers = geoJsonLayer.getLayers();
      if (layers.length === 0) {
        console.error("No valid geometry found in file");
        return;
      }

      drawnItems.value.clearLayers();

      const layer = layers[0] as L.Polygon;

      const geoJson = layer.toGeoJSON();
      if (geoJson.geometry.type === "Polygon") {
        drawnItems.value.addLayer(layer);
        emit("bounds-change", geoJson as GeoJSON.Feature<GeoJSON.Polygon>);
      } else {
        console.warn("Please only pass a Polygon in the GeoJSON.");
      }
    } catch (err) {
      console.error("Failed to parse as GeoJSON:", err);
    }
  };
  reader.readAsText(file);
}
</script>

<template>
  <div
    id="map"
    @drop="handleMapDrop"
    @dragover.prevent
    @dragenter.prevent
  ></div>
</template>

<style scoped>
#map {
  height: 100vh;
  width: 100vw;
}
</style>
