// Marzipano ships no TypeScript types. This declares only the small part the prototype uses, so a
// typo in a call still fails the type check instead of failing in the browser.
declare module "marzipano" {
  export class Viewer {
    constructor(element: HTMLElement, options?: { controls?: { mouseViewMode?: "drag" | "qtvr" } });
    createScene(options: { source: ImageUrlSource; geometry: EquirectGeometry; view: RectilinearView }): Scene;
    destroy(): void;
  }
  export class Scene {
    switchTo(options?: { transitionDuration?: number }, done?: () => void): void;
  }
  export class ImageUrlSource {
    static fromString(url: string): ImageUrlSource;
  }
  export class EquirectGeometry {
    constructor(levels: Array<{ width: number }>);
  }
  export class RectilinearView {
    constructor(params?: { yaw?: number; pitch?: number; fov?: number }, limiter?: unknown);
    static limit: { traditional(maxResolution: number, maxVFov: number): unknown };
    yaw(): number;
    setYaw(yaw: number): void;
    pitch(): number;
    setPitch(pitch: number): void;
  }
  const Marzipano: {
    Viewer: typeof Viewer;
    ImageUrlSource: typeof ImageUrlSource;
    EquirectGeometry: typeof EquirectGeometry;
    RectilinearView: typeof RectilinearView;
  };
  export default Marzipano;
}
