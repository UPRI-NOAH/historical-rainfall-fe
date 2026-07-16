export interface FileMetadata {
  name: string;
  size: number;
  duration: number;
  timestamp: Date;
}

export interface MapImage {
  filename: string;
  url: string;
  boundingPolygon: [[number, number], [number, number]];
  size: number;
  durationHours: number;
  timestamp: string;
}

export interface ImageManifestEntry {
  filename: string;
  timestamp: string;
  durationHours: number;
}

export interface ImageManifest {
  regionName: string;
  boundingPolygon: [[number, number], [number, number]];
  images: ImageManifestEntry[];
}
