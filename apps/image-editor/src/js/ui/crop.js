import forEach from 'tui-code-snippet/collection/forEach';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/crop';
import { assignmentForDestroy, toInteger } from '@/util';
import InputField from '@/ui/tools/input';
import { defaultCropPixelValues } from '@/consts';

/**
 * Crop ui class
 * @class
 * @ignore
 */
class Crop extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'crop',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });

    this.status = 'active';

    this._els = {
      apply: this.selector('.tie-crop-button .apply'),
      cancel: this.selector('.tie-crop-button .cancel'),
      preset: this.selector('.tie-crop-preset-button'),
      width: new InputField(
        this.selector('.tui-image-editor-cropzone-ranges .tie-width-range-value'),
        defaultCropPixelValues
      ),
      height: new InputField(
        this.selector('.tui-image-editor-cropzone-ranges .tie-height-range-value'),
        defaultCropPixelValues
      ),
    };

    this.defaultPresetButton = this._els.preset.querySelector('.preset-none');
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();

    assignmentForDestroy(this);
  }

  /**
   * Add event for crop
   * @param {Object} actions - actions for crop
   *   @param {Function} actions.crop - crop action
   *   @param {Function} actions.cancel - cancel action
   *   @param {Function} actions.preset - draw rectzone at a predefined ratio
   */
  addEvent(actions) {
    this._els.width.on('change', this._changeWidthHandler.bind(this));
    this._els.height.on('change', this._changeHeightHandler.bind(this));
    const apply = this._applyEventHandler.bind(this);
    const cancel = this._cancelEventHandler.bind(this);
    const cropzonePreset = this._cropzonePresetEventHandler.bind(this);

    this.eventHandler = {
      apply,
      cancel,
      cropzonePreset,
    };

    this.actions = actions;
    this._els.apply.addEventListener('click', apply);
    this._els.cancel.addEventListener('click', cancel);
    this._els.preset.addEventListener('click', cropzonePreset);
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.apply.removeEventListener('click', this.eventHandler.apply);
    this._els.cancel.removeEventListener('click', this.eventHandler.cancel);
    this._els.preset.removeEventListener('click', this.eventHandler.cropzonePreset);
  }

  _applyEventHandler() {
    this.actions.crop();
    this._els.apply.classList.remove('active');
  }

  _cancelEventHandler() {
    this.actions.cancel();
    this._els.apply.classList.remove('active');
  }

  _cropzonePresetEventHandler(event) {
    const button = event.target.closest('.tui-image-editor-button.preset');
    if (button) {
      const [presetType] = button.className.match(/preset-[^\s]+/);

      this._setPresetButtonActive(button);
      this.actions.preset(presetType);
    }
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.actions.modeChange('crop');
    const dimensions = this.actions.getCurrentDimensions();
    const rect = this.actions.getCurrentCropzoneRect();
    this.setLimit({
      minWidth: defaultCropPixelValues.min,
      maxWidth: dimensions.width,
      minHeight: defaultCropPixelValues.min,
      maxHeight: dimensions.height,
    });
    this.setWidthValue(rect.width);
    this.setHeightValue(rect.height);
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.actions.stopDrawingMode();
    this._setPresetButtonActive();
  }

  /**
   * Change apply button status
   * @param {Boolean} enableStatus - apply button status
   */
  changeApplyButtonStatus(enableStatus) {
    if (enableStatus) {
      this._els.apply.classList.add('active');
    } else {
      this._els.apply.classList.remove('active');
    }
  }

  /**
   * Set preset button to active status
   * @param {HTMLElement} button - event target element
   * @private
   */
  _setPresetButtonActive(button = this.defaultPresetButton) {
    forEach(this._els.preset.querySelectorAll('.preset'), (presetButton) => {
      presetButton.classList.remove('active');
    });

    if (button) {
      button.classList.add('active');
    }
  }

  /**
   * Set dimension limits
   * @param {object} limits - expect dimension limits for change
   */
  setLimit(limits) {
    this._els.width.min = this.calcMinValue(limits.minWidth);
    this._els.height.min = this.calcMinValue(limits.minHeight);
    this._els.width.max = this.calcMaxValue(limits.maxWidth);
    this._els.height.max = this.calcMaxValue(limits.maxHeight);
  }

  /**
   * Calculate max value
   * @param {number} maxValue - max value
   * @returns {number}
   */
  calcMaxValue(maxValue) {
    if (maxValue <= 0) {
      maxValue = defaultCropPixelValues.max;
    }

    return maxValue;
  }

  /**
   * Calculate min value
   * @param {number} minValue - min value
   * @returns {number}
   */
  calcMinValue(minValue) {
    if (minValue <= 0) {
      minValue = defaultCropPixelValues.min;
    }

    return minValue;
  }

  /**
   * Set width value
   * @param {number} value - expect value for widthRange change
   * @param {boolean} trigger - fire change event control
   */
  setWidthValue(value, trigger = false) {
    this._els.width.value = value;
    if (trigger) {
      this._els.width.trigger('change');
    }
  }

  /**
   * Set height value
   * @param {number} value - expect value for heightRange change
   * @param {boolean} trigger - fire change event control
   */
  setHeightValue(value, trigger = false) {
    this._els.height.value = value;
    if (trigger) {
      this._els.height.trigger('change');
    }
  }

  setRectSize(rect) {
    const { width, height } = rect || {};
    this.setWidthValue(width || 0, false);
    this.setHeightValue(height || 0, false);
  }

  /**
   * Change width
   * @param {number} value - width range value
   * @private
   */
  _changeWidthHandler(value) {
    this.actions.resize('width', toInteger(value));
  }

  /**
   * Change height
   * @param {number} value - height range value
   * @private
   */
  _changeHeightHandler(value) {
    this.actions.resize('height', toInteger(value));
  }
}

export default Crop;
