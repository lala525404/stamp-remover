
export interface ProcessingSettings {
  redSensitivity: number; // 0 to 100
  lightnessThreshold: number; // 0 to 255
  edgeSoftness: number; // 0 to 10
  chromaThreshold: number; // 0 to 100
  targetColor: string; // Hex color for the seal
  detectionMode: 'red' | 'black'; // Added support for black seals
}

export interface AnalysisResult {
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  detectedColor: string;
  recommendation: string;
}
