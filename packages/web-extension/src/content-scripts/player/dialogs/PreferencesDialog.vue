<template>
  <BasicDialog
    name="PreferencesDialog"
    gravity-x="flex-end"
    gravity-y="flex-end"
    @show="loadPlayerOptions"
  >
    <template v-if="!hasActivePlayerGroup">
      <div class="as-p-4 as-space-y-8">
        <GeneralSettings small>
          <template v-if="playerOptions != null">
            <RaisedContainer
              v-for="optionGroup of playerOptions"
              :key="optionGroup.title"
              dark
              @click="setActiveOptionGroup(optionGroup)"
            >
              <div
                class="as-h-10 as-px-4 as-flex as-flex-row as-items-center as-text-left as-w-full as-space-x-4"
              >
                <WebExtImg
                  v-if="optionGroup.icon != null"
                  :src="optionGroup.icon"
                  class="as-left"
                />
                <p class="as-flex-1">{{ optionGroup.title }}</p>
                <p class="as-text-on-surface as-text-opacity-medium">
                  {{ getSelectedOption(optionGroup) }}
                </p>
                <WebExtImg src="ic_chevron_right.svg" class="as-opacity-medium" />
              </div>
            </RaisedContainer>
          </template>
          <RaisedButton v-else dark @click="showOriginalPlayer">
            <div class="as-flex as-justify-between as-w-full">
              <p class="as-remove-text as-body-1">{{ serviceName }} Settings</p>
            </div>
          </RaisedButton>
          <RaisedButton dark @click="openExtensionOptions">
            <div class="as-flex as-justify-between as-w-full">
              <p class="as-remove-text as-body-1">All Settings</p>
            </div>
          </RaisedButton>
        </GeneralSettings>
        <SkippedSections two-columns />
      </div>
    </template>

    <template v-else>
      <div class="as-flex as-flex-col as-min-w-32 as-max-w-sm as-h-64 as-overflow-y-hidden">
        <div
          class="as-flex as-flex-row as-items-center as-space-x-4 as-border-b as-border-on-surface as-border-opacity-divider as-flex-shrink-0 as-p-3"
        >
          <WebExtImg
            class="as-box-content as-w-6 as-h-6 as-p-1 as--m-1 as-bg-on-surface as-bg-opacity-0 hover:as-bg-opacity-hover as-cursor-pointer as-rounded-full"
            src="ic_chevron_left.svg"
            :draggable="false"
            @click="setActiveOptionGroup(undefined)"
          />
          <h6 class="as-pt-0.5">{{ activePlayerGroup?.title }}</h6>
        </div>
        <div class="as-flex-1 as-overflow-y-auto as-p-2">
          <ul v-for="option of activeOptions" :key="option.title" @click="onClickOption(option)">
            <li class="as-flex as-flex-row as-items-center as-space-x-4 as-py-2 as-cursor-pointer">
              <Icon
                :path="getRadioIcon(option.isSelected)"
                :class="getRadioIconClass(option.isSelected)"
              />
              <p class="as-text-on-surface" :class="getLabelClass(option.isSelected)">
                {{ option.title }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </BasicDialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import useRadioIcon from '~/common/composition/useRadioIcon';
import Messenger from '~/common/utils/Messenger';
import { PlayerOption, PlayerOptionGroup } from '~types';
import { usePlayerConfig } from '../composition/player-config';
import { useHideDialog } from '../state/useDialogState';
import { useShowOriginalPlayer } from '../state/usePlayerVisibility';

const playerConfig = usePlayerConfig();

const openExtensionOptions = () => {
  new Messenger<RuntimeMessageTypes>('General Settings').send(
    '@anime-skip/open-all-settings',
    undefined
  );
};
const activePlayerGroup = ref<PlayerOptionGroup | undefined>();
const hasActivePlayerGroup = computed(() => activePlayerGroup.value != null);
const setActiveOptionGroup = (optionGroup: PlayerOptionGroup | undefined): void => {
  activePlayerGroup.value = optionGroup;
};
onMounted(() => setActiveOptionGroup(undefined));
const getSelectedOption = (optionGroup: PlayerOptionGroup) => {
  const selected = optionGroup.options.filter(option => option.isSelected);
  if (selected.length === 0) return '';
  return selected[0].title;
};
const playerOptions = ref<PlayerOptionGroup[]>();
const loadPlayerOptions = async () => {
  playerOptions.value = (await playerConfig.getPlaybackOptions?.())?.filter(
    group => group.options.length > 0
  );
};

const activeOptions = computed(() => activePlayerGroup.value?.options ?? []);
const { getRadioIcon, getRadioIconClass, getLabelClass } = useRadioIcon();
const hideDialog = useHideDialog();
const onClickOption = (option: PlayerOption) => {
  option.node.click();
  hideDialog();
  setActiveOptionGroup(undefined);
};

const serviceName = playerConfig.serviceDisplayName;
const _showOriginalPlayer = useShowOriginalPlayer();
function showOriginalPlayer() {
  hideDialog();
  _showOriginalPlayer();
}
</script>

<style lang="scss">
@import '../utils/constants.scss';

#PreferencesDialog {
  padding-right: 16px;
  padding-bottom: $toolbarHeight + 4px + 8px;

  .as-dialog-root-container {
    max-height: 300px;
    max-width: 400px;
  }
}
</style>

<style scoped>
.as-py-2 {
  /* TODO: THIS IS NOT JUST PY, ITS P */
  padding: 0.5rem !important;
}

.as-min-w-32 {
  min-width: 16rem;
}
</style>
