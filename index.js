import {LitElement, html} from '@polymer/lit-element';

export default class MoeRecaptcha extends LitElement {

  static get properties() {
    return {
      version: {type: Number},
      sitekey: {type: String},
      size: {type: String},
      badge: {type: String},
      recaptchaId: {type: Number},
      token: {type: String},
      executionPromise: {type: Object},
      executionPromiseResolve: {type: Function},
      executionPromiseReject: {type: Function},
    };
  }

  constructor() {
    super();
  }

  updated(changedProperties) {
    if (changedProperties.has('version') && this.version !== 2 && this.version !== 3) {
      throw new Error('moe-recaptcha version must be either 2 or 3');
    }
  }

  render() {
    return html`
<style>:host{display:block;}</style>
`;
  }

  /**
   * @returns {Promise<void>}
   */
  load(container) {
    const FETCHING = `__fetchingGrecaptchaLibrary${this.version}__`;
    const CALLBACK = `__onloadGrecaptchaCallback${this.version}__`;
    if (!window[FETCHING]) {
      return new Promise((resolve, reject) => {
        window[FETCHING] = true;
        window[CALLBACK] = () => {
          window[FETCHING] = false;

          if (parseInt(this.version) === 2) {
            this.recaptchaId = grecaptcha.render(container, {
              sitekey: this.sitekey,
              callback: this._responseCallback.bind(this),
              'error-callback': this._errorCallback.bind(this),
              'expired-callback': this._expiredCallback.bind(this),
              isolated: true,
              size: this.size,
              badge: this.badge,
            });
          }

          resolve();
        };

        const script = document.createElement('script');
        const apiUrl = this.version === 2 ?
          `//www.google.com/recaptcha/api.js?onload=${CALLBACK}&render=explicit` :
          `//www.google.com/recaptcha/api.js?onload=${CALLBACK}&render=${this.sitekey}`;
        script.setAttribute('id', 'grecaptchaLibrary');
        script.setAttribute('src', apiUrl);
        script.onerror = (err) => {
          console.error(err);
          window[FETCHING] = false;
          reject(err);
        };
        document.head.appendChild(script);
      });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * @returns {Promise<String>}
   */
  execute(...args) {
    if (this.version === 2) {
      return this._executev2();
    } else if (this.version === 3) {
      return this._executev3(...args);
    }
  }

  reset() {
    if (this.version === 2 && this.recaptchaId) {
      grecaptcha.reset(this.recaptchaId);
    }
  }

  _executev2() {
    if (this.recaptchaId && grecaptcha.getResponse(this.recaptchaId)) {
      return Promise.resolve(grecaptcha.getResponse(this.recaptchaId));
    }

    this.executionPromise = new Promise((resolve, reject) => {
      this.executionPromiseResolve = resolve;
      this.executionPromiseReject = reject;
    });
    grecaptcha.execute(this.recaptchaId);
    return this.executionPromise;
  }

  _executev3(action) {
    return grecaptcha.execute(this.sitekey, {action});
  }

  _responseCallback(token) {
    this.token = token;
    this.executionPromiseResolve(token);
  }

  _errorCallback(err) {
    console.error(err);
    this.executionPromiseReject(err);
  }

  _expiredCallback() {
    console.log('recaptcha expired');
    this.reset();
  }
}

window.customElements.define('moe-recaptcha', MoeRecaptcha);
