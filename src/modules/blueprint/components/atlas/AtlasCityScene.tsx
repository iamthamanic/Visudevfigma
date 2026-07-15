/**
 * Lazy-loaded 3D city scene for AtlasView (Three.js + R3F, no drei).
 * Colored clusters + selection glow for Wave 4 Zielbild parity.
 */

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { AtlasOrbitControls } from "./AtlasOrbitControls.js";
import { resolveClusterPalette, type AtlasClusterCategory } from "./atlas-cluster-theme.js";
import { getAtlasCityTheme } from "./atlas-city-theme.js";
import type { CityBlock } from "./build-city-blocks.js";
import styles from "../../styles/AtlasView.module.css";

interface BuildingProps {
  block: CityBlock;
  selected: boolean;
  blockDefault: string;
  blockSelected: string;
  categoryColor: string;
  onSelect: (nodeId: string) => void;
}

function Building({
  block,
  selected,
  blockDefault,
  blockSelected,
  categoryColor,
  onSelect,
}: BuildingProps): JSX.Element {
  const fillColor = selected
    ? blockSelected || categoryColor || block.color || blockDefault
    : categoryColor || block.color || blockDefault;
  const emissive = selected ? fillColor || blockDefault : blockDefault;
  const emissiveIntensity = selected ? 0.55 : 0;

  return (
    <group position={[block.x, 0, block.z]}>
      {selected ? (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[block.width * 0.85, block.width * 1.35, 48]} />
          <meshBasicMaterial color={emissive} transparent opacity={0.55} />
        </mesh>
      ) : null}
      <mesh
        position={[0, block.height / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(block.id);
        }}
      >
        <boxGeometry args={[block.width, block.height, block.depth]} />
        <meshStandardMaterial
          color={fillColor || undefined}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
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
  const categoryPalette = useMemo(() => {
    const categories = Array.from(
      new Set(blocks.map((block) => block.clusterCategory)),
    ) as AtlasClusterCategory[];
    return resolveClusterPalette(categories);
  }, [blocks]);
  const hasColoredBlocks = blocks.some((block) =>
    Boolean(categoryPalette[block.clusterCategory] || block.color),
  );

  return (
    <div
      className={styles.cityCanvasWrap}
      data-testid="atlas-city-scene"
      data-colored-clusters={hasColoredBlocks ? "true" : "false"}
    >
      <Canvas
        className={styles.cityCanvas}
        camera={{ position: [0, 16, 22], fov: 42 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        {theme.background ? <color attach="background" args={[theme.background]} /> : null}
        <ambientLight intensity={0.6} />
        <directionalLight position={[8, 14, 6]} intensity={0.95} />
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
            categoryColor={categoryPalette[block.clusterCategory] || ""}
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
