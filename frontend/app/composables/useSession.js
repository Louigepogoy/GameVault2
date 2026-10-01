import { formatDuration } from '~/utils/constants';
import { launchLinkFor, launcherFor, openLaunchLink } from '~/utils/launch';

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
      if (quiet)
        toast.success(`Saved ${formatDuration(session.duration_minutes)} on "${session.game_title}".`);
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

  /**
   * Open the game itself (Steam, another launcher, or the Android app) if it has a link
   * for this device. Returns true if there was something to open.
   */
  /** Open the game's launch link for this device. Returns its launcher, or null if none. */
  function launchNow(game) {
    const link = launchLinkFor(game);
    if (!link) return null;
    openLaunchLink(link);
    return launcherFor(link);
  }

  function announceLaunch(game, { name, help }, { timerStarted }) {
    toast.success(
      `${timerStarted ? '▶️ Timer started. ' : ''}Opening "${game.title}"${name === 'the app' ? '' : ` in ${name}`}…`,
      {
        duration: 6000,
        // Browsers can't tell us whether the launcher opened, so offer help instead of guessing.
        ...(help && {
          action: { label: 'Not opening?', onClick: () => window.open(help, '_blank', 'noopener') },
        }),
      },
    );
  }

  /** Open the game without starting the timer. Returns true if there was something to open. */
  function openGame(game) {
    const launcher = launchNow(game);
    if (launcher) announceLaunch(game, launcher, { timerStarted: false });
    return !!launcher;
  }

  async function start(game, { launch = true } = {}) {
    if (active.value?.game_id === game.id) return active.value;
    // Open the game first, while this still counts as part of the click: browsers block
    // new tabs and app links opened after waiting on the network.
    const launcher = launch ? launchNow(game) : null;
    // Switching games: save the current session first.
    if (active.value && !(await stop({ quiet: true }))) return null;
    busy.value = true;
    try {
      const { session, now } = await api.startSession(game.id);
      syncClock(now);
      active.value = session;
      version.value++; // a backlog game becomes "playing"
      if (launcher) {
        announceLaunch(game, launcher, { timerStarted: true });
      } else {
        toast.success(`▶️ Timer started for "${game.title}". Have fun!`);
        // No link for this device: say how to make the game open next time.
        if (launch) {
          toast.info('Tip: add a launch link (Edit game) so Start playing opens the game too.', {
            duration: 6000,
          });
        }
      }
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

  return {
    active,
    loaded,
    skewMs,
    busy,
    version,
    justStopped,
    refresh,
    reset,
    start,
    stop,
    discard,
    openGame,
  };
}
