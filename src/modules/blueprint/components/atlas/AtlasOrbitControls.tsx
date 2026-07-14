/**
 * Orbit controls for Atlas 3D city — Three.js only (no @react-three/drei).
 */

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";

export function AtlasOrbitControls(): null {
  const { camera, gl } = useThree();

  useEffect(() => {
    const controls = new OrbitControlsImpl(camera, gl.domElement);
    controls.enablePan = true;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 8;
    controls.maxDistance = 48;
    controls.update();
    return () => controls.dispose();
  }, [camera, gl]);

  return null;
}
