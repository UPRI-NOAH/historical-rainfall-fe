import { unzip } from "fflate";
import { generateImages, retrieveImages } from "../api/client";
import { generation } from "../store";
import type { ImageManifest, MapImage, TaskStatusResponse } from "../types";
import type { Feature, Polygon } from "geojson";

export function unzipToFiles(
  data: Uint8Array
): Promise<Record<string, Uint8Array<ArrayBuffer>>> {
  // since unzipping the file can take a variable amount of time
  return new Promise((resolve, reject) => {
    unzip(data, (err, unzipped) => {
      if (err) reject(err);
      else resolve(unzipped);
    });
  });
}

export async function extractImagesFromManifest(
  files: Record<string, Uint8Array<ArrayBuffer>>
): Promise<MapImage[]> {
  // have a manifest to contain the metadata for each image (location, accumulation range)
  const manifestBytes = files["manifest.json"];
  if (!manifestBytes) throw new Error("manifest.json not found in zip");

  const manifestText = new TextDecoder().decode(manifestBytes);
  const manifest: ImageManifest = JSON.parse(manifestText);

  return manifest.images.map((entry) => {

    const fileData = files[entry.filename];

    if (!fileData) {
      throw new Error(`Image not found in ZIP: ${entry.filename}`);
    }
    const blob = new Blob([fileData], { type: "image/png" });

    return {
      filename: entry.filename,
      url: URL.createObjectURL(blob),
      size: blob.size,
      boundingPolygon: manifest.boundingPolygon,
      durationHours: entry.durationHours,
      timestamp: entry.timestamp,
    };
  });
}

export async function loadImages(
  boundingPolygon: Feature<Polygon> | null,
  uploadedGeoJSON: File | null,
  startDate: Date,
  endDate: Date,
  sources: string[],
  frequency: number,
  signal: AbortSignal
) {
  generation.status = ""
  generation.progress = 0
  const task_id = await generateImages(
    boundingPolygon,
    uploadedGeoJSON,
    startDate,
    endDate,
    sources,
    frequency,
    signal
  );
  let zipBlob;
  generation.task_id = task_id;
  while (true) {
    sleep(500);

    const { type, data } = await retrieveImages(task_id, signal);

    if (type == "complete") {
      zipBlob = data as Blob;
      break;
    }

    generation.status = (data as TaskStatusResponse).status;
    generation.progress = (data as TaskStatusResponse).progress;
    generation.status_code = (data as TaskStatusResponse).status_code;
  }

  generation.status = "Parsing data";

  const buffer = new Uint8Array(await zipBlob.arrayBuffer());
  const unzipped = await unzipToFiles(buffer);
  const mapImages = await extractImagesFromManifest(unzipped);

  return { mapImages, zipBlob };
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
