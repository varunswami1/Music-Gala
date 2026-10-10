// HTML controls for the card ring: group-by switch and a scrollable cluster list. Owner: Person 3.
import type { GroupMode } from './clusters';
import { useRing } from './ringStore';

const MODES: GroupMode[] = ['artist', 'year', 'all'];

export function RingControls() {
  const mode = useRing((s) => s.mode);
  const index = useRing((s) => s.index);
  const clusters = useRing((s) => s.clusters);
  const setMode = useRing((s) => s.setMode);
  const setIndex = useRing((s) => s.setIndex);
  return (
    <>
      <div className="eyebrow" style={{ marginTop: 18 }}>GROUP BY</div>
      <div style={{ display: 'flex', gap: 16, margin: '6px 0 10px' }}>
        {MODES.map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
            style={{ padding: '2px 0', color: mode === m ? '#fff' : '#8a8a8a', textDecoration: mode === m ? 'underline' : 'none', textUnderlineOffset: 5 }}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="eyebrow">CLUSTER {clusters.length ? index + 1 : 0} / {clusters.length}</div>
      <div className="list" style={{ marginTop: 8 }}>
        {clusters.map((c, i) => (
          <button key={c.id} type="button" onClick={() => setIndex(i)} aria-current={i === index}
            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '5px 0', textAlign: 'left',
              borderBottom: '1px solid #ffffff14', letterSpacing: '.12em', color: i === index ? '#fff' : '#8a8a8a' }}>
            <span>{c.label}</span><span>{c.count}</span>
          </button>
        ))}
      </div>
    </>
  );
}
