"use client";

import { CameraViewfinder } from "./camera-viewfinder";
import { ShutterButton } from "./shutter-button";

export function CaptureScreen({ onCapture }: { onCapture?: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-stone-200">
      <CameraViewfinder />

      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-12">
        <ShutterButton onCapture={onCapture} />
      </div>
    </div>
  );
}
