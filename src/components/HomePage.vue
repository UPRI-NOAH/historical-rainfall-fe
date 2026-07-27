<script setup lang="ts">
import {
  watch,
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
(globalThis as any).type = true;
import "proj4leaflet";
import type { MapImage } from "../types";
import type { Feature, Polygon, GeoJsonObject } from "geojson";

const props = defineProps<{
  contour: MapImage | null;
  uploadedGeometry: GeoJsonObject | null;
}>();

const emit = defineEmits<{
  (e: "bounds-change", bounds: Feature<Polygon> | null, drawn: boolean): void;
  (e: "clear-upload"): void;
}>();

const map = shallowRef<L.Map>();
const currentOverlay = ref<L.ImageOverlay | null>(null);
const drawnItems = shallowRef(new L.FeatureGroup());

onMounted(() => {
  var my_EPSG_4326 = new (L as any).Proj.CRS(
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
  }).setView([12.8797, 120.7740], 5);

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

  const drawControl = new (L.Control as any).Draw({
    position: "topright",
    draw: {
      rectangle: true,
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

  map.value.on((L as any).Draw.Event.CREATED, (e: any) => {
    drawnItems.value.clearLayers();
    drawnItems.value.addLayer(e.layer);

    emit("clear-upload");
    emit("bounds-change", e.layer.toGeoJSON(), true);
  });

  map.value.on((L as any).Draw.Event.DELETED, () => {
    if (drawnItems.value.getLayers().length === 0) {
      emit("bounds-change", null, false);
    }
    emit("clear-upload");
  });

  map.value.on((L as any).Draw.Event.EDITED, (e: any) => {
    const layer = e.layers.getLayers()[0];
    emit("bounds-change", layer ? layer.toGeoJSON() : null, true);
  });
});

watch(
  () => props.contour,
  (newContour: MapImage | null) => {
    if (newContour == null) return;
    if (map.value == null) return;

    if (currentOverlay.value) {
      currentOverlay.value.setUrl(newContour.url);
      currentOverlay.value.setBounds(L.latLngBounds(newContour.boundingPolygon));
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

watch(
    () => props.uploadedGeometry,
    (geometry) => {
        if (!geometry || !map.value) return;

        previewGeoJSON(geometry);
    }
);

function previewGeoJSON(geometry: GeoJsonObject) {
    if (!map.value) return;
    drawnItems.value.clearLayers();
    const geoJsonLayer = L.geoJSON(geometry, {
            style: {
                color: "#3388ff",
                weight: 3,
                fillOpacity: 0.2,
            },
        });

    geoJsonLayer.eachLayer((layer) => {
        drawnItems.value.addLayer(layer);
    });

    map.value.fitBounds(geoJsonLayer.getBounds());

    const layer = drawnItems.value.getLayers()[0];

    if (layer instanceof L.Polygon) {
        emit(
            "bounds-change",
            layer.toGeoJSON() as Feature<Polygon>,
            false
        );
    }
  }

onBeforeUnmount(() => {
  map.value?.remove();
});


</script>

<template>
  <div
    id="map"
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
