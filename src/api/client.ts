import type { Feature, Polygon } from "geojson";
import { format } from "date-fns";
import type { TaskStatusResponse } from "../types";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

// takes in a vueRef that it can update
export async function generateImages(
  boundingPolygon: Feature<Polygon> | null,
  uploadedGeoJSON: File | null,
  startDate: Date,
  endDate: Date,
  sources: string[],
  frequency: number,
  signal: AbortSignal
): Promise<string> {
  startDate.setMinutes(0, 0, 0);
  endDate.setMinutes(0, 0, 0);

  if (startDate > endDate) {
    throw new Error("Start date is later than end date.");
  }

  const possibleSources = ["jaxa", "pagasa", "pmt"];
  if (!sources.every((s) => possibleSources.includes(s))) {
    throw new Error("Invalid source passed.");
  }

  const formData = new FormData();

  if (uploadedGeoJSON) {
    formData.append("bbox", uploadedGeoJSON);
  } else if (boundingPolygon) {
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
  formData.append("frequency", frequency.toString());

  // Start job
  const startResponse = await fetch(
    `${API_BASE_URL}/api/rainfall/historical-contours/download/`,
    {
      method: "POST",
      body: formData,
      signal: signal,
    }
  );

  if (!startResponse.ok) {
    throw new Error("Failed to start generation.");
  }

  const { task_id } = (await startResponse.json()) as {
    task_id: string;
  };

  return task_id;
}

export async function retrieveImages(task_id: string, signal: AbortSignal) {
  console.log("Polling URL:", `${API_BASE_URL}/api/rainfall/historical-contours/${task_id}/`);
  const statusResponse = await fetch(
    `${API_BASE_URL}/api/rainfall/historical-contours/${task_id}/`,
    {
      signal: signal,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    }
  );

  if (!statusResponse.ok) {
    throw new Error("Failed to check task status.");
  }

  if (statusResponse.status === 200) {
    const blob = await statusResponse.blob();
    return { type: "complete", data: blob };
  } else if (statusResponse.status === 202) {
    const json: TaskStatusResponse = await statusResponse.json();
    return { type: "pending", data: json };
  } else {
    throw new Error("Generation failed.");
  }
}

export async function cancelImages(task_id: string) {
  console.log("TASK ID: ", task_id);
  const response = await fetch(
    `${API_BASE_URL}/api/rainfall/historical-contours/${task_id}/`,
    {
      method: "DELETE",
    }
  );

  if (response.status === 200) {
    console.log("Successful cancellation!");
  }

  throw new Error("Failed to cancel generation.");
}
