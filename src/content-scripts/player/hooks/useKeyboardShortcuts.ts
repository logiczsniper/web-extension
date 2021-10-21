import { onUnmounted } from 'vue';
import {
  KeyboardShortcutActionToExecuteMap,
  usePrimaryKeyboardShortcutPrefs,
  useSecondaryKeyboardShortcutPrefs,
} from '~/common/state/useKeyboardShortcutPrefs';
import UsageStats from '~/common/utils/UsageStats';
import Utils from '~/common/utils/Utils';

// The first instance of this helper should only report usage stats
let instanceCount = 0;

export function useKeyboardShortcuts(
  componentName: string,
  shortcuts: KeyboardShortcutActionToExecuteMap
) {
  const isFirst = instanceCount == 0;
  instanceCount++;
  console.debug(`[${componentName}] useKeyboardShortcuts()`);

  const { primaryShortcutsKeyToActionsMap } = usePrimaryKeyboardShortcutPrefs();
  const { secondaryShortcutsKeyToActionsMap } = useSecondaryKeyboardShortcutPrefs();

  const onKeyDownInstance = (event: KeyboardEvent) => {
    // Prevent triggers from firing while typing
    if (document.activeElement?.tagName === 'INPUT' || !Utils.isKeyComboAllowed(event)) {
      return;
    }

    const keyCombo = Utils.keyComboFromEvent(event);
    const keyActions = [
      ...(primaryShortcutsKeyToActionsMap.value[keyCombo] ?? []),
      ...(secondaryShortcutsKeyToActionsMap.value[keyCombo] ?? []),
    ];

    console.debug(`[${componentName}] Pressed ${keyCombo} -> [${keyActions.join(', ')}]`);
    setTimeout(() => {
      keyActions.forEach(action => {
        if (isFirst)
          void UsageStats.saveEvent('used_keyboard_shortcut', { keyCombo, operation: action });
        shortcuts[action]?.();
      });
    }, 0);
  };

  window.addKeyDownListener(onKeyDownInstance);
  onUnmounted(() => window.removeKeyDownListener(onKeyDownInstance));

  return shortcuts;
}
