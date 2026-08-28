import { SplineScene } from "@/components/ui/spline-scene";
import { Spotlight } from "@/components/ui/spotlight";

const ROBOT_SCENE_URL = "/spline/adam-robot.splinecode";

export function HeroRobot() {
  return (
    <div
      className="relative h-[280px] w-full overflow-hidden sm:h-[420px] lg:h-[720px] lg:-translate-x-4 lg:-translate-y-6"
      role="region"
      aria-label="Interactive 3D robot scene"
    >
      <div className="relative z-10 h-full w-full">
        <SplineScene
          scene={ROBOT_SCENE_URL}
          className="h-full w-full"
        />
      </div>

      <Spotlight
        size={420}
        className="z-20"
      />
    </div>
  );
}