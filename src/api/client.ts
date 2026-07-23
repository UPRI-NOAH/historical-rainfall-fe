import type { Feature, Polygon } from "geojson";
import { format } from "date-fns";
import type { WorkflowStatusResponse } from "../types";

// takes in a vueRef that it can update
export async function generateImages(
  boundingPolygon: Feature<Polygon> | null,
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
  formData.append("frequency", frequency.toString());

  // Start job
  const startResponse = await fetch(
    "http://localhost:8000/api/rainfall/historical-contours/download/",
    {
      method: "POST",
      body: formData,
      signal: signal,
    }
  );

  if (!startResponse.ok) {
    throw new Error("Failed to start generation.");
  }

  const { workflow_id } = (await startResponse.json()) as {
    workflow_id: string;
  };

  return workflow_id;
}

export async function retrieveImages(workflow_id: string, signal: AbortSignal) {
  const statusResponse = await fetch(
    `http://localhost:8000/api/rainfall/historical-contours/${workflow_id}/`,
    {
      signal: signal,
    }
  );

  if (!statusResponse.ok) {
    throw new Error("Failed to check task status.");
  }

  if (statusResponse.status === 200) {
    const blob = await statusResponse.blob();
    return { type: "complete", data: blob };
  } else if (statusResponse.status === 202) {
    const json: WorkflowStatusResponse = await statusResponse.json();
    return { type: "pending", data: json };
  } else {
    throw new Error("Generation failed.");
  }
}

export async function cancelImages(workflow_id: string) {
  console.log("WORKFLOW ID: ", workflow_id);
  const response = await fetch(
    `http://localhost:8000/api/rainfall/historical-contours/${workflow_id}/`,
    {
      method: "DELETE",
    }
  );

  if (response.status === 200) {
    console.log("Successful cancellation!");
  }

  throw new Error("Failed to cancel generation.");
}
