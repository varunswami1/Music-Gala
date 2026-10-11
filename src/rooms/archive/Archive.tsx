import { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox, WireCylinder } from '../../world/Wire';
import { Door } from '../../world/Door';

interface LogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  badge: string;
  summary: string;
  details: {
    role: string;
    person: string;
    changes: string[];
  }[];
  comparisons?: { room: string; before: string; after: string }[];
}

const TIMELINE_DATA: LogEntry[] = [
  {
    id: 'iter-2',
    version: 'Iteration 2 (Current)',
    date: 'October 11, 2026',
    title: 'Architectural Realism & Visual Overhaul',
    badge: 'LATEST UPDATE',
    summary:
      'Major overhaul aligning the entire world with the architectural reference site (virtuallyeverafter). Massive scale expansions, 360° camera wrap, layered multi-depth card ring, walk-in glass studio booth with moving singers, and cinematic warp transitions.',
    details: [
      {
        role: 'Shell & Engine',
        person: 'Person 1 (v1.1)',
        changes: [
          'Unified wireframe outlines: all WireBox and WireCylinder elements now render in crisp architectural white.',
          '360° panoramic wrap around camera origin with full rotation freedom (maxYaw = PI).',
          'Flush door placements against walls with bright vertical posts.',
          'Custom cursor: morphs from a fine dot into an expanding white disc with contextual label on hover.',
          'Dynamic scramble-text hint bar and slimline top menu.',
        ],
      },
      {
        role: 'Lobby & Studio',
        person: 'Person 2 (v2)',
        changes: [
          'Grand Lobby Hall: expanded to 20m wide x 64m long with ceiling trusses, tall windows, 12 dotted columns, and floating 2x scale instruments.',
          '30m Studio: separate walk-in vocal booth with dotted walls, foam, and glass door.',
          'Animated singers: Somay seated on stool, Varun standing at microphone—breathing, swaying, and gesturing.',
          'W/S/A/D keyboard walk and trackpad scroll navigation (useWalk.ts) with blocked pinch-zoom.',
          '3-piece mixing desk, dual monitors, equipment rack towers, and operator chair.',
        ],
      },
      {
        role: 'Heaven & Corridor',
        person: 'Person 3 (v2)',
        changes: [
          'Architectural 3D Corridor: replaced floating frames with a deep procession hall featuring alternating monumental portals.',
          'Multi-layered Card Ring: albums-behind-albums cylinder ring where ↑/↓ shifts layers and ←/→ rotates.',
          'Persistent top navigation bar (HEAVEN · LIBRARY · PLAYLISTS · TASTE · DISCOVER · ARCHIVE) with active indicator and breadcrumbs.',
          'Instant library-wide search (hotkey /) that flies the matching card to the front.',
        ],
      },
      {
        role: 'Song & Artist Rooms',
        person: 'Person 4 (v2)',
        changes: [
          'Strict black & white wireframe aesthetic removing color tinting and glowing floor rings.',
          'Center artwork scaled 3x (9 units in Song Room, 7.2x9 in Artist Room) commanding full presence.',
          'Doors placed at 110° to sides, reachable via mouse drag look-around or arrow keys.',
          'Integrated seamless 80-second looping drone audio (ambient.mp3) with automatic fade-out during song playback.',
        ],
      },
      {
        role: 'Taste, Discover & Warp',
        person: 'Person 5 (v2)',
        changes: [
          'Taste Room redesign: grand piano with open lid, violin stand, turntable, and 4 dot-cloud audience figures.',
          'Equalizer skyline back wall and top-4 artist landscape canvas frames (CanvasFrame.tsx).',
          'Cinematic Warp transition: zooms camera into door, rushes through line/dot tunnel, and glides into target room.',
          'Optimized Discover room door positioning and subtle wall line opacity.',
        ],
      },
    ],
    comparisons: [
      { room: 'Lobby', before: 'Small room with static outlines', after: '64m monumental hall with floating instruments & roof trusses' },
      { room: 'Studio', before: 'Single room with flat figures', after: '30m hall with walk-in glass booth & animated breathing singers' },
      { room: 'Heaven / Library', before: 'Hanging card frames', after: 'Deep 3D corridor with alternating portals & layered card cylinders' },
      { room: 'Song / Artist', before: 'Color-tinted glowing cylinder', after: 'Monochrome wireframe with 3x scale center artwork and 110° side doors' },
      { room: 'Taste', before: 'Simple columns and stats', after: 'Full concert hall with grand piano, violin, turntable, and skyline equalizer' },
    ],
  },
  {
    id: 'iter-1',
    version: 'Iteration 1',
    date: 'October 10, 2026',
    title: 'Core World Loop & Full Library Integration',
    badge: 'SYSTEM MERGE',
    summary:
      'Integration of all 5 team members codebases into a single running app. Real YouTube Music library of 10,402 tracks and 5,303 artists, enriched artist bios, lyrics lookup, Last.fm recommendation integration, and YouTube embedded playback.',
    details: [
      {
        role: 'Data Pipeline',
        person: 'Person 5',
        changes: [
          '10,402 songs & 5,303 artists imported into public/data/library.json.',
          '98 enriched artist biographies & profiles in public/data/artists.json.',
          '6,680 individual lyrics files parsed and indexed in public/data/lyrics/.',
          'Offline Python verification suite (15/15 tests passing).',
        ],
      },
      {
        role: 'Playback Engine',
        person: 'Person 4',
        changes: [
          'YouTube IFrame playback engine (songPlayer.ts) with seek, volume, and honest status display.',
          'Scrollable synchronized lyrics panel with licensed credit attribution.',
          'Similar songs strip with "From library" and "New" recommendation tabs.',
        ],
      },
      {
        role: 'Card Ring & Playlists',
        person: 'Person 3',
        changes: [
          'High-performance cylinder card ring instancing up to 54 cards per cluster.',
          'Grouping by Artist, Year, or All.',
          'Playlist viewer rendering custom playlists from library metadata.',
        ],
      },
    ],
  },
  {
    id: 'phase-0',
    version: 'Phase 0',
    date: 'October 9, 2026',
    title: 'Foundation, Contracts & Architecture',
    badge: 'ORIGIN',
    summary:
      'Initial project scaffolding using Vite, React 18, Three.js, React Three Fiber, and Zustand. Defined shared contract (RoomDef, Song, Artist) and 5-person ownership structure.',
    details: [
      {
        role: 'Architecture & Shell',
        person: 'Person 1',
        changes: [
          'Single persistent WorldCanvas architecture with plug-in room system.',
          'Contract v1 frozen with TypeScript strict types.',
          'Shared primitives: Door, Poster, WireBox, WireCylinder.',
          'Acceptance checklist: 6-point verification criteria.',
        ],
      },
    ],
  },
];

function ArchiveScene() {
  const go = useApp((s) => s.go);
  useRoomCamera([0, 1.8, 8], [0, 1.8, -12]);
  useHint('ARCHIVE · DRAG TO LOOK AROUND · CLICK DOORS TO NAVIGATE');

  return (
    <group>
      {/* Gallery Hall Enclosure */}
      <WireBox size={[18, 9, 36]} position={[0, 4.5, -6]} />

      {/* Title Sign on Back Wall */}
      <Text position={[0, 7.2, -23.8]} fontSize={0.7} letterSpacing={0.25} color="#ffffff">
        PROJECT ARCHIVE
      </Text>
      <Text position={[0, 6.4, -23.8]} fontSize={0.16} letterSpacing={0.2} color="#8a8a8a" maxWidth={12} textAlign="center">
        CHRONICLE OF DEVELOPMENT · ITERATIONS · ARCHITECTURAL EVOLUTION
      </Text>

      {/* Three floating timeline monolith plinths in 3D */}
      {TIMELINE_DATA.map((entry, idx) => {
        const x = (idx - 1) * 5.5;
        const z = -6 + idx * 3;
        return (
          <group key={entry.id} position={[x, 0, z]}>
            {/* Pedestal Box */}
            <WireBox size={[3.2, 1.2, 3.2]} position={[0, 0.6, 0]} />
            <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.1, 1.2, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>
            <WireCylinder radius={1.2} height={1.8} segments={16} position={[0, 2.1, 0]} />
            <Text position={[0, 3.4, 0]} fontSize={0.22} letterSpacing={0.18} color="#ffffff" textAlign="center">
              {entry.version.toUpperCase()}
            </Text>
            <Text position={[0, 3.1, 0]} fontSize={0.12} letterSpacing={0.15} color="#8a8a8a" textAlign="center">
              {entry.date.toUpperCase()}
            </Text>
          </group>
        );
      })}

      {/* Return Doors */}
      <Door label="LOBBY" sublabel="Entrance Hall" position={[-7.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} onOpen={() => go(PATHS.lobby)} />
      <Door label="HEAVEN" sublabel="Corridor of Sound" position={[7.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]} onOpen={() => go(PATHS.heaven)} />
      <Door label="STUDIO" sublabel="Acoustic Booth" position={[0, 0, -23.8]} rotation={[0, 0, 0]} onOpen={() => go(PATHS.studio)} />
    </group>
  );
}

function ArchivePanels() {
  const [selectedId, setSelectedId] = useState<string>('iter-2');
  const [activeTab, setActiveTab] = useState<'timeline' | 'diffs'>('timeline');

  const selected = useMemo(() => TIMELINE_DATA.find((e) => e.id === selectedId) || TIMELINE_DATA[0], [selectedId]);

  return (
    <>
      {/* Left Panel: Epoch Selector & Summary */}
      <aside className="panel left" style={{ width: '380px', maxHeight: '78vh', overflowY: 'auto' }}>
        <div className="eyebrow">CHRONOLOGY</div>
        <h1 style={{ fontSize: '20px', letterSpacing: '0.15em', margin: '4px 0 12px' }}>ARCHIVE</h1>
        <p className="calm" style={{ fontSize: '11px', lineHeight: '1.6', marginBottom: '16px' }}>
          Living record of project updates, iterative architectural refinements, and milestone additions.
        </p>

        {/* Milestone Selector List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {TIMELINE_DATA.map((entry) => {
            const isCur = entry.id === selectedId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: isCur ? '#ffffff15' : '#ffffff05',
                  border: isCur ? '1px solid #ffffff' : '1px solid #ffffff1a',
                  color: isCur ? '#ffffff' : '#888888',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', letterSpacing: '0.15em', fontWeight: isCur ? 600 : 400 }}>{entry.version}</span>
                  <span style={{ fontSize: '9px', padding: '2px 6px', background: isCur ? '#fff' : '#ffffff1a', color: isCur ? '#000' : '#888' }}>
                    {entry.badge}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#666666', marginTop: '4px' }}>{entry.date}</div>
              </button>
            );
          })}
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #ffffff1a', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: activeTab === 'timeline' ? '#fff' : '#666',
              borderBottom: activeTab === 'timeline' ? '2px solid #fff' : 'none',
              paddingBottom: '4px',
            }}
          >
            CHANGELOG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diffs')}
            style={{
              fontSize: '11px',
              letterSpacing: '0.18em',
              color: activeTab === 'diffs' ? '#fff' : '#666',
              borderBottom: activeTab === 'diffs' ? '2px solid #fff' : 'none',
              paddingBottom: '4px',
            }}
          >
            BEFORE VS AFTER
          </button>
        </div>
      </aside>

      {/* Right Panel: Detailed Changelog & Comparisons */}
      <aside className="panel right" style={{ width: '460px', maxHeight: '78vh', overflowY: 'auto' }}>
        <div className="eyebrow">{selected.date.toUpperCase()}</div>
        <h2 style={{ fontSize: '17px', letterSpacing: '0.15em', margin: '4px 0 8px' }}>{selected.title}</h2>
        <p style={{ fontSize: '11px', color: '#aaaaaa', lineHeight: '1.6', marginBottom: '18px' }}>{selected.summary}</p>

        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selected.details.map((d, i) => (
              <div key={i} style={{ borderLeft: '2px solid #ffffff33', paddingLeft: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <b style={{ fontSize: '12px', letterSpacing: '0.15em', color: '#ffffff' }}>{d.role}</b>
                  <span style={{ fontSize: '10px', color: '#888888' }}>{d.person}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#888888', lineHeight: '1.6' }}>
                  {d.changes.map((c, j) => (
                    <li key={j} style={{ marginBottom: '4px' }}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'diffs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selected.comparisons && selected.comparisons.length > 0 ? (
              selected.comparisons.map((cmp, i) => (
                <div key={i} style={{ background: '#ffffff06', border: '1px solid #ffffff12', padding: '10px 12px' }}>
                  <b style={{ display: 'block', fontSize: '12px', letterSpacing: '0.15em', color: '#ffffff', marginBottom: '6px' }}>
                    {cmp.room}
                  </b>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                    <div style={{ color: '#888888' }}>
                      <span style={{ display: 'block', color: '#555555', marginBottom: '2px' }}>BEFORE</span>
                      {cmp.before}
                    </div>
                    <div style={{ color: '#cccccc' }}>
                      <span style={{ display: 'block', color: '#ffffff', marginBottom: '2px' }}>NOW</span>
                      {cmp.after}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '11px', color: '#666666' }}>No direct diffs recorded for this milestone.</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export const archiveRoom: RoomDef = {
  id: 'archive',
  path: PATHS.archive,
  title: 'Archive',
  Scene: ArchiveScene,
  Panels: ArchivePanels,
};
