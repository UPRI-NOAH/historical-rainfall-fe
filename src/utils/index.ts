import { unzip } from "fflate";
import { generateImages } from "../api/client";
import type { ImageManifest, MapImage } from "../types";
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
    const fileData = files[entry.name];
    const blob = new Blob([fileData], { type: "image/png" });

    return {
      filename: entry.name,
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
  startDate: Date,
  endDate: Date,
  sources: string[],
  hours: string[],
  signal: AbortSignal
) {
  const zipBlob = await generateImages(
    boundingPolygon,
    startDate,
    endDate,
    sources,
    hours,
    signal
  );

  const buffer = new Uint8Array(await zipBlob.arrayBuffer());
  const unzipped = await unzipToFiles(buffer);
  console.log(unzipped);
  const mapImages = await extractImagesFromManifest(unzipped);

  return { mapImages, zipBlob };
}
