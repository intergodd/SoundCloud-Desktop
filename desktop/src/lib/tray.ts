import { usePlayerStore } from '../stores/player';
import { handlePrev } from './audio';
import { safeListen } from './diagnostics';

safeListen<string>('tray-action', (event) => {
  const store = usePlayerStore.getState();
  switch (event.payload) {
    case 'play_pause':
      store.togglePlay();
      break;
    case 'next':
      store.next();
      break;
    case 'prev':
      handlePrev();
      break;
  }
});
