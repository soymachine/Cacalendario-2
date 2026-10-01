import { useEffect, useState } from 'react';
import { supabaseMedics as supabase } from '../lib/supabase';

// Foto de una comida en el panel médico. El bucket `food-photos` es privado:
// se pide una signed URL de vida corta con la sesión del profesional (la RLS
// de Storage solo la concede para pacientes vinculados y aceptados). Nunca se
// usan URLs públicas ni se guardan en la base de datos.

const TTL_S = 10 * 60;
const cache = new Map<string, { url: string; expires: number }>();

async function signedUrl(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now() + 30_000) return hit.url;
  const { data, error } = await supabase.storage.from('food-photos').createSignedUrl(path, TTL_S);
  if (error || !data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, expires: Date.now() + TTL_S * 1000 });
  return data.signedUrl;
}

interface FoodPhotoProps {
  path: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Muestra texto en el hueco mientras carga o si falla (para fotos grandes). */
  verbose?: boolean;
}

export default function FoodPhoto({ path, alt, className, style, verbose }: FoodPhotoProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    signedUrl(path).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [path]);

  if (!url) {
    return (
      <span
        className={`inline-flex items-center justify-center bg-fx-ink-100 text-fx-ink-300 text-[10px] ${className ?? ''}`}
        style={style}
        aria-label={failed ? 'Foto no disponible' : 'Cargando foto'}
      >
        {verbose ? (failed ? 'Foto no disponible' : 'Cargando foto…') : (failed ? '—' : '…')}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`object-cover ${className ?? ''}`}
      style={style}
      onError={() => { cache.delete(path); setFailed(true); setUrl(null); }}
    />
  );
}
