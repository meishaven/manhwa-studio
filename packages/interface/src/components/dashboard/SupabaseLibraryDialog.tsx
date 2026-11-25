import { useCallback, useEffect, useRef, useState } from "react";
import { CloudDownload, Database, LoaderCircle, X } from "lucide-react";

interface SupabaseLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (
    files: File[],
    folders?: ReadonlyMap<File, string>,
  ) => Promise<void> | void;
}

interface ConnectionConfig {
  projectUrl: string;
  publishableKey: string;
}

interface ManhwaRow {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
}

interface ChapterRow {
  id: number;
  manhwa_id: string;
  title: string | null;
  chapter_number: number | null;
  page_count: number | null;
}

interface ChapterPageRow {
  id: number;
  chapter_id: number;
  page_number: number;
  storage_path: string;
}

type BusyState = "connecting" | "chapters" | "importing" | null;

const CONFIG_STORAGE_KEY = "manhwa-studio.supabase-library.v1";
const DEFAULT_PROJECT_URL = "https://qsnenrkzlnwhrcnsmlum.supabase.co";
const STORAGE_BUCKET = "manhwa-pages";

const readSavedConnection = (): ConnectionConfig => {
  const fallback = { projectUrl: DEFAULT_PROJECT_URL, publishableKey: "" };
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ConnectionConfig>;
    return {
      projectUrl: typeof parsed.projectUrl === "string" ? parsed.projectUrl : fallback.projectUrl,
      publishableKey: typeof parsed.publishableKey === "string" ? parsed.publishableKey : "",
    };
  } catch {
    return fallback;
  }
};

const validateConnection = (value: ConnectionConfig): ConnectionConfig => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value.projectUrl.trim());
  } catch {
    throw new Error("Enter a valid Supabase Project URL.");
  }

  const isLocal = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
  if (parsedUrl.protocol !== "https:" && !isLocal) {
    throw new Error("The Supabase Project URL must use HTTPS.");
  }
  if (!isLocal && !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("Use your project's *.supabase.co URL.");
  }

  const publishableKey = value.publishableKey.trim();
  if (
    !publishableKey ||
    publishableKey.startsWith("sb_secret_") ||
    publishableKey.includes("service_role") ||
    (!publishableKey.startsWith("sb_publishable_") && !publishableKey.startsWith("eyJ"))
  ) {
    throw new Error("Use a Supabase publishable key (sb_publishable_...). Never use a secret or service-role key here.");
  }

  return { projectUrl: parsedUrl.origin, publishableKey };
};

const readApiError = async (response: Response): Promise<string> => {
  const body = await response.text();
  if (body) {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const message = parsed.message ?? parsed.error_description ?? parsed.error ?? parsed.details;
      if (typeof message === "string" && message.trim()) return message.trim();
    } catch {
      return body.slice(0, 300);
    }
  }
  return "Supabase request failed (HTTP " + response.status + ").";
};

const requestSupabaseJson = async <T,>(
  config: ConnectionConfig,
  path: string,
): Promise<T> => {
  const response = await fetch(config.projectUrl + path, {
    method: "GET",
    headers: {
      apikey: config.publishableKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return (await response.json()) as T;
};

const encodeStoragePath = (storagePath: string): string => {
  const normalized = storagePath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (
    normalized.startsWith("/") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Supabase returned an invalid image path.");
  }
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
};

const imageMimeType = (fileName: string): string => {
  const extension = fileName.toLowerCase().split(".").pop();
  switch (extension) {
    case "png": return "image/png";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "bmp": return "image/bmp";
    default: return "image/jpeg";
  }
};

export default function SupabaseLibraryDialog({
  open,
  onClose,
  onImport,
}: SupabaseLibraryDialogProps) {
  const [connection, setConnection] = useState<ConnectionConfig>(readSavedConnection);
  const [series, setSeries] = useState<ManhwaRow[]>([]);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<BusyState>(null);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const autoConnectAttempted = useRef(false);

  const selectedSeries = series.find((item) => item.id === selectedSeriesId) ?? null;
  const selectedChapter = chapters.find((item) => String(item.id) === selectedChapterId) ?? null;

  const connect = useCallback(async () => {
    setBusy("connecting");
    setNotice("");
    setProgress("");
    setConnected(false);
    setSeries([]);
    setChapters([]);
    setSelectedSeriesId("");
    setSelectedChapterId("");

    try {
      const valid = validateConnection(connection);
      const rows = await requestSupabaseJson<ManhwaRow[]>(
        valid,
        "/rest/v1/manhwa?select=id,title,slug,cover_url&order=title.asc",
      );
      if (!Array.isArray(rows)) {
        throw new Error("Supabase returned an unexpected library response.");
      }
      try {
        window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(valid));
      } catch {
        // The connection still works for this session if local storage is unavailable.
      }
      setConnection(valid);
      setSeries(rows);
      setConnected(true);
      setNotice(rows.length ? "Connected. Found " + rows.length + " series." : "Connected, but the library is empty.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not connect to Supabase.");
    } finally {
      setBusy(null);
    }
  }, [connection]);

  useEffect(() => {
    if (!open) {
      autoConnectAttempted.current = false;
      return;
    }
    if (!autoConnectAttempted.current && connection.publishableKey.trim()) {
      autoConnectAttempted.current = true;
      void connect();
    }
  }, [open, connection.publishableKey, connect]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && busy !== "importing") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onClose]);

  const updateConnection = (field: keyof ConnectionConfig, value: string) => {
    setConnection((current) => ({ ...current, [field]: value }));
    setConnected(false);
    setSeries([]);
    setChapters([]);
    setSelectedSeriesId("");
    setSelectedChapterId("");
    setNotice("");
  };

  const selectSeries = async (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSelectedChapterId("");
    setChapters([]);
    setNotice("");
    if (!seriesId) return;

    setBusy("chapters");
    try {
      const rows = await requestSupabaseJson<ChapterRow[]>(
        validateConnection(connection),
        "/rest/v1/chapters?select=id,manhwa_id,title,chapter_number,page_count&manhwa_id=eq." +
          encodeURIComponent(seriesId) +
          "&order=chapter_number.asc",
      );
      if (!Array.isArray(rows)) throw new Error("Supabase returned an unexpected chapter list.");
      setChapters(rows);
      setNotice(rows.length ? "Found " + rows.length + " chapters." : "No chapters are stored for this series yet.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load chapters.");
    } finally {
      setBusy(null);
    }
  };

  const importSelectedChapter = async () => {
    if (!selectedSeries || !selectedChapter) return;
    setBusy("importing");
    setNotice("");
    setProgress("Reading chapter page records…");

    try {
      const valid = validateConnection(connection);
      const pageRows = await requestSupabaseJson<ChapterPageRow[]>(
        valid,
        "/rest/v1/chapter_pages?select=id,chapter_id,page_number,storage_path&chapter_id=eq." +
          selectedChapter.id +
          "&order=page_number.asc",
      );
      if (!Array.isArray(pageRows) || pageRows.length === 0) {
        throw new Error("This chapter has no page records in Supabase.");
      }

      const files: File[] = [];
      for (let offset = 0; offset < pageRows.length; offset += 3) {
        const batch = pageRows.slice(offset, offset + 3);
        setProgress("Downloading page images " + Math.min(offset + batch.length, pageRows.length) + " / " + pageRows.length + "…");
        const downloaded = await Promise.all(batch.map(async (page) => {
          const storagePath = encodeStoragePath(page.storage_path);
          const response = await fetch(
            valid.projectUrl + "/storage/v1/object/public/" + STORAGE_BUCKET + "/" + storagePath,
            {
              method: "GET",
              headers: { apikey: valid.publishableKey },
              cache: "no-store",
            },
          );
          if (!response.ok) {
            throw new Error("Could not download page " + page.page_number + " (HTTP " + response.status + ").");
          }

          const blob = await response.blob();
          const sourceName = page.storage_path.split("/").pop() || ("page_" + page.page_number + ".jpg");
          const extension = sourceName.match(/\.(png|jpe?g|webp|gif|bmp)$/i)?.[0] ?? ".jpg";
          const fileName = "page_" + String(page.page_number).padStart(3, "0") + extension.toLowerCase();
          return new File([blob], fileName, { type: blob.type || imageMimeType(fileName) });
        }));
        files.push(...downloaded);
      }

      const chapterLabel = selectedSeries.title + " — " + (selectedChapter.title || ("Chapter " + (selectedChapter.chapter_number ?? selectedChapter.id)));
      const folderToken = "supabase-library::" + selectedSeries.id + "::" + selectedChapter.id + "::" + chapterLabel;
      const folders = new Map<File, string>(files.map((file) => [file, folderToken]));

      setProgress("Adding " + files.length + " pages to the KŌMA workspace…");
      await onImport(files, folders);
      setNotice("Imported " + files.length + " pages from " + chapterLabel + ".");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Chapter import failed.");
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && busy !== "importing") onClose();
      }}
    >
      <section
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supabase-library-title"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database size={20} />
            </span>
            <div>
              <h2 id="supabase-library-title" className="text-base font-semibold">Supabase Library</h2>
              <p className="text-xs opacity-65">Browse your stored manhwa chapters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy === "importing"}
            aria-label="Close Supabase Library"
            className="rounded-md p-2 opacity-70 transition hover:bg-white/10 hover:opacity-100 disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              Supabase Project URL
              <input
                value={connection.projectUrl}
                onChange={(event) => updateConnection("projectUrl", event.target.value)}
                placeholder="https://your-project.supabase.co"
                spellCheck={false}
                autoComplete="url"
                className="w-full rounded-md border border-[var(--border)] bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              Publishable key
              <input
                type="password"
                value={connection.publishableKey}
                onChange={(event) => updateConnection("publishableKey", event.target.value)}
                placeholder="sb_publishable_…"
                spellCheck={false}
                autoComplete="off"
                className="w-full rounded-md border border-[var(--border)] bg-black/20 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void connect()}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "connecting" ? <LoaderCircle size={15} className="animate-spin" /> : <Database size={15} />}
              {busy === "connecting" ? "Connecting…" : connected ? "Reconnect" : "Connect"}
            </button>
            {connected && <span className="text-xs text-emerald-400">Connected · read-only importer</span>}
          </div>

          {connected && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium">
                Manhwa
                <select
                  value={selectedSeriesId}
                  onChange={(event) => void selectSeries(event.target.value)}
                  disabled={busy !== null}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Select a series…</option>
                  {series.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium">
                Chapter
                <select
                  value={selectedChapterId}
                  onChange={(event) => setSelectedChapterId(event.target.value)}
                  disabled={!selectedSeriesId || busy !== null}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--panel-bg)] px-3 py-2 text-sm"
                >
                  <option value="">Select a chapter…</option>
                  {chapters.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.title || ("Chapter " + (item.chapter_number ?? item.id))} · {item.page_count ?? "?"} pages
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {(progress || notice) && (
            <p className="rounded-md border border-[var(--border)] bg-black/15 px-3 py-2 text-sm" role="status" aria-live="polite">
              {progress || notice}
            </p>
          )}

          <p className="text-xs leading-relaxed opacity-65">
            This first connector only reads your series, chapter records and original images. It does not edit or delete Supabase data, and it keeps the Korean originals unchanged. The connection uses a publishable key; never paste a secret or service-role key here.
          </p>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
          <span className="text-xs opacity-60">
            {selectedChapter ? (selectedChapter.page_count ?? "?") + " recorded pages" : "Select a chapter to import"}
          </span>
          <button
            type="button"
            onClick={() => void importSelectedChapter()}
            disabled={!connected || !selectedChapter || busy !== null}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--auth-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy === "importing" ? <LoaderCircle size={15} className="animate-spin" /> : <CloudDownload size={15} />}
            {busy === "importing" ? "Importing…" : "Import chapter to Studio"}
          </button>
        </footer>
      </section>
    </div>
  );
}
