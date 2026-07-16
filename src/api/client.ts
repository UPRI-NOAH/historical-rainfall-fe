import type { Feature, Polygon } from "geojson";
import { format } from "date-fns";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateImages(
  boundingPolygon: Feature<Polygon> | null,
  startDate: Date,
  endDate: Date,
  sources: string[],
  hours: string[],
  signal: AbortSignal
): Promise<Blob> {
  startDate.setMinutes(0, 0, 0);
  endDate.setMinutes(0, 0, 0);

  if (startDate > endDate) {
    throw new Error("Start date is later than end date.");
  }

  const possibleSources = ["jaxa", "pagasa", "pagasa-pmt"];
  if (!sources.every((s) => possibleSources.includes(s))) {
    throw new Error("Invalid source passed.");
  }

  const possibleHours = ["1", "3", "6", "12", "24"];
  if (!hours.every((s) => possibleHours.includes(s))) {
    throw new Error("Invalid hours passed.");
  }

  const formData = new FormData();

  if (boundingPolygon !== null) {
    console.log(boundingPolygon);
    formData.append(
      "bbox",
      new File([JSON.stringify(boundingPolygon)], "polygon.geojson", {
        type: "application/geo+json",
      })
    );
  }

  formData.append("start_str", format(startDate, "yyyy/MM/dd HH:mm"));
  formData.append("end_str", format(endDate, "yyyy/MM/dd HH:mm"));
  formData.append("sources", sources.join(","));
  formData.append("hours", hours.join(","));

  // Start job
  const startResponse = await fetch(
    "http://localhost:8000/api/rainfall/historical-contours/download/",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!startResponse.ok) {
    throw new Error("Failed to start generation.");
  }

  const { task_id } = (await startResponse.json()) as { task_id: string };

  // Poll until finished
  while (true) {
    await sleep(2000);

    const statusResponse = await fetch(
      `http://localhost:8000/api/rainfall/historical-contours/${task_id}/`,
      {
        signal: signal,
      }
    );

    if (!statusResponse.ok) {
      throw new Error("Failed to check task status.");
    }

    if (statusResponse.status === 200) {
      return statusResponse.blob();
    } else if (statusResponse.status === 202) {
      console.log("Still polling for new images.");
      continue;
    } else {
      throw new Error("Generation failed.");
    }
  }
}
