import { formatDuration } from '~/utils/constants';

/**
 * The running play session, shared by every page.
 * Elapsed time is always derived from the server's started_at (corrected for this
 * device's clock), so the timer survives reloads, app restarts and other devices.
 */
export function useSession() {
  const api = useApi();
  const toast = useToast();

  const active = useState('session-active', () => null);
  const loaded = useState('session-loaded', () => false);
  const skewMs = useState('session-skew', () => 0); // server clock minus this device's clock
  const busy = useState('session-busy', () => false);
  // Bumped whenever play time is logged, so pages can refetch hours/stats/heatmap.
  const version = useState('session-version', () => 0);
  // The session that was just stopped; opens the "Nice session!" sheet.
  const justStopped = useState('session-just-stopped', () => null);

  const syncClock = (now) => now && (skewMs.value = new Date(now).getTime() - Date.now());

  async function refresh() {
    try {
      const { session, now } = await api.getActiveSession();
      syncClock(now);
      active.value = session;
    } catch {
      // Keep what we had; the next refresh will fix it.
    } finally {
      loaded.value = true;
    }
  }

  function reset() {
    active.value = null;
    loaded.value = false;
    justStopped.value = null;
  }

  /** Stop the running session. Opens the note sheet unless `quiet`. */
  async function stop({ quiet = false } = {}) {
    const running = active.value;
    if (!running) return null;
    busy.value = true;
    try {
      const { session } = await api.stopSession(running.id);
      active.value = null;
      version.value++;
      if (quiet) toast.success(`Saved ${formatDuration(session.duration_minutes)} on "${session.game_title}".`);
      else justStopped.value = { ...session, game_cover_url: running.game_cover_url };
      return session;
    } catch (err) {
      toast.error(err.message);
      await refresh(); // maybe it was already stopped elsewhere
      return null;
    } finally {
      busy.value = false;
    }
  }

  async function start(game) {
    if (active.value?.game_id === game.id) return active.value;
    // Switching games: save the current session first.
    if (active.value && !(await stop({ quiet: true }))) return null;
    busy.value = true;
    try {
      const { session, now } = await api.startSession(game.id);
      syncClock(now);
      active.value = session;
      version.value++; // a backlog game becomes "playing"
      toast.success(`▶️ Timer started for "${game.title}". Have fun!`);
      return session;
    } catch (err) {
      toast.error(err.message);
      await refresh();
      return null;
    } finally {
      busy.value = false;
    }
  }

  /** Throw away a session started by mistake (no time is logged). */
  async function discard() {
    const running = active.value;
    if (!running) return;
    busy.value = true;
    try {
      await api.discardSession(running.id);
      active.value = null;
      toast.info(`Discarded the session for "${running.game_title}".`);
    } catch (err) {
      toast.error(err.message);
      await refresh();
    } finally {
      busy.value = false;
    }
  }

  return { active, loaded, skewMs, busy, version, justStopped, refresh, reset, start, stop, discard };
}
