// "Similar songs" strip with FROM LIBRARY / NEW tabs. Owner: Person 4. HTML overlay, bottom centre.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Song } from '../../contract/types';
import { to } from '../../contract/routes';
import { useLibraryData } from '../../data/library';
import { rankSimilar } from './similarity';
import { useRecommendations } from './recommendations';

function Thumb({ url, title }: { url?: string | null; title: string }) {
  return url ? <img src={url} alt="" loading="lazy" /> : <span className="ph" aria-hidden="true">{title.trim().charAt(0).toUpperCase() || '·'}</span>;
}

export function SimilarStrip({ song, tint }: { song: Song; tint: string }) {
  const lib = useLibraryData();
  const [tab, setTab] = useState<'library' | 'new'>('library');
  const similar = useMemo(() => (lib ? rankSimilar(song, lib.songs) : []), [lib, song]);
  const recs = useRecommendations(song, tab === 'new');
  return (
    <section className="sp-strip" aria-label="Similar songs" style={{ ['--tint' as string]: tint }}>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'library'} onClick={() => setTab('library')}>FROM LIBRARY</button>
        <button role="tab" aria-selected={tab === 'new'} onClick={() => setTab('new')}>NEW</button>
      </div>
      <div className="track" onWheel={(e) => e.stopPropagation()}>
        {tab === 'library' && (similar.length === 0
          ? <p className="empty">NOTHING SIMILAR IN YOUR LIBRARY YET</p>
          : similar.map((s) => (
            <Link key={s.id} className="card" to={to.song(s.id)} title={`${s.title} · ${s.artistNames.join(', ')}`}>
              <Thumb url={s.coverUrl} title={s.title} />
              <b>{s.title}</b><small>{s.artistNames.join(', ') || 'Unknown artist'}</small>
            </Link>
          )))}
        {tab === 'new' && recs.status === 'loading' && <p className="empty">LOADING…</p>}
        {tab === 'new' && recs.status === 'unavailable' && <p className="empty">{recs.reason}</p>}
        {tab === 'new' && recs.status === 'ok' && (recs.items.length === 0
          ? <p className="empty">NO NEW SUGGESTIONS FOR THIS SONG</p>
          : recs.items.map((r, i) => {
            const body = (<><Thumb url={r.coverUrl} title={r.title} /><b>{r.title}</b><small>{r.artistName}</small><em>{r.reason}</em></>);
            if (r.inLibrary && r.songId) return <Link key={i} className="card" to={to.song(r.songId)}>{body}</Link>;
            if (r.youtubeId) return <a key={i} className="card" href={`https://www.youtube.com/watch?v=${encodeURIComponent(r.youtubeId)}`} target="_blank" rel="noopener noreferrer">{body}</a>;
            return <div key={i} className="card static">{body}</div>;
          }))}
      </div>
    </section>
  );
}
