<template>
  <div class="VolumeButton" :class="{ 'as-dragging': isDragging }">
    <ToolbarButton class="as-inner-button as-w-12" @click="toggleMute">
      <WebExtImg src="ic_volume_muted.svg" class="as-ic-muted" :class="volumeClass" />
      <WebExtImg src="ic_volume_speaker.svg" class="as-ic-speaker" :class="volumeClass" />
      <WebExtImg src="ic_volume_low.svg" class="as-ic-low" :class="volumeClass" />
      <WebExtImg src="ic_volume_high.svg" class="as-ic-high" :class="volumeClass" />
    </ToolbarButton>
    <Slider
      class="as-slider"
      :progress="videoState.volumePercent"
      :max="100"
      @seek="setVolumePercent"
      @seek:start="isDragging = true"
      @seek:end="isDragging = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useVideoController, useVideoState } from '../../state/useVideoState';

const isDragging = ref(false);

const videoState = useVideoState();
const volumeClass = computed(() => {
  if (videoState.isMuted) return 'as-muted';
  if (videoState.volumePercent <= 10) return 'as-low';
  if (videoState.volumePercent < 60) return 'as-medium';
  return 'as-high';
});

const VOLUME_STEP = 10; // percent
const { setVolumePercent, toggleMute } = useVideoController();
useKeyboardShortcuts('VolumeButton', {
  volumeUp() {
    setVolumePercent(videoState.volumePercent + VOLUME_STEP);
  },
  volumeDown() {
    setVolumePercent(videoState.volumePercent - VOLUME_STEP);
  },
});
</script>

<style lang="scss" scoped>
.VolumeButton {
  display: flex;
  flex-direction: row;
  width: 136px;
  max-width: 57px;
  align-items: center;
  overflow-x: hidden;
  padding-right: 16px;
  margin-right: 8px;
  transition: 200ms;
  transition-property: max-width;
  &:hover,
  &.as-dragging {
    max-width: 136px;
  }

  .as-inner-button {
    margin-right: 8px;
    position: relative;
    img {
      position: absolute;
      left: 12px;
      right: 12px;
      top: 8px;
      bottom: 8px;
      transition: 200ms;
    }

    .as-ic-muted {
      opacity: 0;
      &.as-muted {
        opacity: 1;
      }
    }
    .as-ic-speaker {
      &.as-muted {
        opacity: 0;
        transform: translateX(-4px);
      }
      &.as-low {
        transform: translateX(0);
      }
      &.as-medium {
        transform: translateX(-2px);
      }
      &.as-high {
        transform: translateX(-4px);
      }
    }
    .as-ic-low {
      &.as-muted {
        opacity: 0;
        transform: translateX(-2px);
      }
      &.as-low {
        opacity: 0;
      }
      &.as-medium {
        // Empty
      }
      &.as-high {
        transform: translateX(-2px);
      }
    }
    .as-ic-high {
      &.as-muted {
        opacity: 0;
      }
      &.as-low {
        opacity: 0;
      }
      &.as-medium {
        opacity: 0;
      }
      &.as-high {
        // Empty
      }
    }
  }

  .as-slider {
    flex: 1;
    cursor: pointer;
    display: none;
  }
  &:hover .as-slider,
  &.as-dragging .as-slider {
    display: block;
  }
}

.as-slider {
  --as-slider-background-color: rgba(255, 255, 255, #{theme('opacity.low')});
  --as-slider-foreground-color: white;
}
</style>
