import forEach from 'tui-code-snippet/collection/forEach';
import CustomEvents from 'tui-code-snippet/customEvents/customEvents';
import { toInteger, clamp } from '@/util';
import { keyCodes } from '@/consts';

const INPUT_FILTER_REGEXP = /(-?)([0-9]*)[^0-9]*([0-9]*)/g;

/**
 * InputField control class
 * @class
 * @ignore
 */
class InputField {
  /**
   * @constructor
   * @extends {View}
   * @param {HTMLElement} inputElement - Html resource
   * @param {Object} options - Input make options
   *  @param {number} options.min - min value
   *  @param {number} options.max - max value
   *  @param {number} options.value - default value
   *  @param {number} [options.useDecimal] - Decimal point processing.
   *  @param {boolean} [options.realTimeEvent] - Reflect live events.
   */
  constructor(inputElement, options = {}) {
    this._value = options.value || 0;
    this.inputElement = inputElement;
    this._min = options.min || 0;
    this._max = options.max || 100;
    this._useDecimal = options.useDecimal;
    this._absMax = this._min * -1 + this._max;
    this.realTimeEvent = options.realTimeEvent || false;
    this._userInputTimer = null;

    this.eventHandler = {
      changeInput: this._changeInput.bind(this),
      changeInputFinally: this._changeValueWithInput.bind(this, true),
      changeInputWithArrow: this._changeValueWithInputKeyEvent.bind(this),
    };

    this._addInputEvent();
    this.value = options.value;
    this.trigger('change');
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeInputEvent();
    forEach(this, (value, key) => {
      this[key] = null;
    });
  }

  get max() {
    return this._max;
  }

  /**
   * Set max value
   * @param {number} maxValue - max value
   */
  set max(maxValue) {
    this._max = maxValue;
    this._absMax = this._min * -1 + this._max;
    this.value = this._value;
  }

  get min() {
    return this._min;
  }

  /**
   * Set min value
   * @param {number} minValue - min value
   */
  set min(minValue) {
    this._min = minValue;
    this.max = this._max;
  }

  /**
   * Get value
   * @returns {Number} value
   */
  get value() {
    return this._value;
  }

  /**
   * Set value
   * @param {Number} value - value
   */
  set value(value) {
    value = this._useDecimal ? value : toInteger(value);
    this._value = value;
    this.inputElement.value = value;
  }

  /**
   * event trigger
   * @param {string} type - type
   */
  trigger(type) {
    this.fire(type, this._value);
  }

  /**
   * Add input editing event
   * @private
   */
  _addInputEvent() {
    this.inputElement.addEventListener('keydown', this.eventHandler.changeInputWithArrow);
    this.inputElement.addEventListener('keydown', this.eventHandler.changeInput);
    this.inputElement.addEventListener('blur', this.eventHandler.changeInputFinally);
  }

  /**
   * Remove range input editing event
   * @private
   */
  _removeInputEvent() {
    this.inputElement.removeEventListener('keydown', this.eventHandler.changeInputWithArrow);
    this.inputElement.removeEventListener('keydown', this.eventHandler.changeInput);
    this.inputElement.removeEventListener('blur', this.eventHandler.changeInputFinally);
  }

  /**
   * change angle event
   * @param {object} event - key event
   * @private
   */
  _changeValueWithInputKeyEvent(event) {
    const { keyCode, target } = event;

    if ([keyCodes.ARROW_UP, keyCodes.ARROW_DOWN].indexOf(keyCode) < 0) {
      return;
    }

    let value = Number(target.value);

    value = this._valueUpDownForKeyEvent(value, keyCode);

    const unChanged = value < this._min || value > this._max;

    if (!unChanged) {
      const clampValue = clamp(value, this._min, this.max);
      this.value = clampValue;
      this.fire('change', clampValue, false);
    }
  }

  /**
   * value up down for input
   * @param {number} value - original value number
   * @param {number} keyCode - input event key code
   * @returns {number} value - changed value
   * @private
   */
  _valueUpDownForKeyEvent(value, keyCode) {
    const step = this._useDecimal ? 0.1 : 1;

    if (keyCode === keyCodes.ARROW_UP) {
      value += step;
    } else if (keyCode === keyCodes.ARROW_DOWN) {
      value -= step;
    }

    return value;
  }

  _changeInput(event) {
    clearTimeout(this._userInputTimer);

    const { keyCode } = event;
    if (
      keyCode < keyCodes.DIGIT_0 ||
      keyCode > keyCodes.NUMPAD_DIGIT_9 ||
      (keyCode > keyCodes.DIGIT_9 && keyCode < keyCodes.NUMPAD_DIGIT_0)
    ) {
      event.preventDefault();

      return;
    }

    this._userInputTimer = setTimeout(() => {
      this._inputSetValue(event.target.value);
    }, 350);
  }

  _inputSetValue(stringValue) {
    let value = this._useDecimal ? Number(stringValue) : toInteger(stringValue);

    value = clamp(value, this._min, this.max);

    this.value = value;
    this.fire('change', value, true);
  }

  /**
   * change angle event
   * @param {boolean} isLast - Is last change
   * @param {object} event - key event
   * @private
   */
  _changeValueWithInput(isLast, event) {
    const { keyCode, target } = event;

    if ([keyCodes.ARROW_UP, keyCodes.ARROW_DOWN].indexOf(keyCode) >= 0) {
      return;
    }

    const stringValue = this._filterForInputText(target.value);
    const waitForChange = !stringValue || isNaN(stringValue);
    target.value = stringValue;

    if (!waitForChange) {
      this._inputSetValue(stringValue);
    }
  }

  /**
   * Unnecessary string filtering.
   * @param {string} inputValue - origin string of input
   * @returns {string} filtered string
   * @private
   */
  _filterForInputText(inputValue) {
    return inputValue.replace(INPUT_FILTER_REGEXP, '$1$2$3');
  }
}

CustomEvents.mixin(InputField);

export default InputField;
