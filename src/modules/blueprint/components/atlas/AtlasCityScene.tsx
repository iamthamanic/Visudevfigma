/**
 * Lazy-loaded 3D city scene for AtlasView (Three.js + R3F, no drei).
 */

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { AtlasOrbitControls } from "./AtlasOrbitControls.js";
import { getAtlasCityTheme } from "./atlas-city-theme.js";
import type { CityBlock } from "./build-city-blocks.js";
import styles from "../../styles/AtlasView.module.css";

interface BuildingProps {
  block: CityBlock;
  selected: boolean;
  blockDefault: string;
  blockSelected: string;
  onSelect: (nodeId: string) => void;
}

function Building({
  block,
  selected,
  blockDefault,
  blockSelected,
  onSelect,
}: BuildingProps): JSX.Element {
  const color = selected ? blockSelected || blockDefault : block.color || blockDefault;

  return (
    <mesh
      position={[block.x, block.height / 2, block.z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(block.id);
      }}
    >
      <boxGeometry args={[block.width, block.height, block.depth]} />
      <meshStandardMaterial color={color || undefined} />
    </mesh>
  );
}

export interface AtlasCitySceneProps {
  blocks: CityBlock[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export function AtlasCityScene({
  blocks,
  selectedNodeId,
  onSelectNode,
}: AtlasCitySceneProps): JSX.Element {
  const theme = useMemo(() => getAtlasCityTheme(), []);

  return (
    <div className={styles.cityCanvasWrap}>
      <Canvas
        className={styles.cityCanvas}
        camera={{ position: [0, 16, 22], fov: 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {theme.background ? <color attach="background" args={[theme.background]} /> : null}
        <ambientLight intensity={0.55} />
        <directionalLight position={[8, 14, 6]} intensity={0.85} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color={theme.ground || undefined} />
        </mesh>
        {blocks.map((block) => (
          <Building
            key={block.id}
            block={block}
            selected={selectedNodeId === block.id}
            blockDefault={theme.blockDefault}
            blockSelected={theme.blockSelected}
            onSelect={onSelectNode}
          />
        ))}
        <AtlasOrbitControls />
      </Canvas>
      <p className={styles.cityHint}>
        3D-Stadt — Gebäude anklicken wählt Knoten; Beschriftungen stehen in der Knotenliste.
      </p>
    </div>
  );
}
