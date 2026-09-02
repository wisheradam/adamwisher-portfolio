"use client";

import Image from "next/image";
import { Suspense, lazy, useEffect, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");

    setWebGLAvailable(Boolean(context));
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          sceneLoaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <Image
          src="/robot-fallback.svg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-contain object-center"
        />
      </div>

      {webGLAvailable !== false && (
        <div
          className={`relative h-full w-full transition-opacity duration-700 ${
            sceneLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <span className="loader" aria-hidden="true" />
                <span className="sr-only">Loading interactive scene…</span>
              </div>
            }
          >
            <Spline
              scene={scene}
              className={className}
              onLoad={() => setSceneLoaded(true)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
