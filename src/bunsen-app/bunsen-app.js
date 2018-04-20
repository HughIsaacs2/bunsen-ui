import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-form/iron-form.js';
import './bunsen-dats.js';
// var websocket = require('websocket-stream')
// import { websocket } from 'websocket-stream/index.js';
// import websocket from 'websocket-stream'
import '../../websocket-stream@latest.js'
/**
 * @customElement
 * @polymer
 */
class BunsenApp extends PolymerElement {
  static get template() {
    return `
    <style>
      :host {
        display: block;
      }
      paper-input {
        position: relative;
        bottom: 25px;
        height: 40px;
        background: #673ab7;
        color: #FFF;
        font-size: 1.5em;
        --paper-input-container-color: #DDD;
        --paper-input-container-focus-color: #FFF;
        --paper-input-container-input-color: #FFF;
      }
      paper-button {
        font-size: 1em;
      }
      iframe {
        width: 100%;
        border: none;
      }
      #peers {
        color: #FFF;
      }
      #peerage {
        color: #FFF;
        margin-top: 10px;
      }
      #installBanner {
        position: fixed;
        bottom: 0px;
        right: 0px;
        width: 100%;
        height: 75px;
        color: #333;
        background: white;
      }
    </style>
      <table style="width: 100%;">
        <tbody><tr>
          <td style="width: 100%">
            <paper-input id="address" name="address" style="margin: 0px 10px;" placeholder="dat://"></paper-input> 
          </td>
          <template is="dom-if" if="{{isFocused}}">
          <td>
            <paper-icon-button id="clear-address" on-tap="clearAddress" style="color: #FFF" icon="backspace"></paper-icon-button> 
          </td>
          <template is="dom-if" if="{{currentAddress}}">
          <td>
            <paper-icon-button id="refresh" on-tap="refresh" style="color: #FFF" icon="refresh"></paper-icon-button> 
          </td>
          </template>
          </template>
        </tr>
      </tbody></table>
      <iframe id="view" style="width:100%"></iframe>
      <bunsen-dats id="datSites"></bunsen-dats>
      <div id="peerage">
      <p style="margin: 5px">Peers</p>
      <div id="peers" style="margin: 5px"></div>
      <div id="installBanner">
        <table>
          <tr>
            <td style="padding: 13px 5px 0px">
              Browse the P2P Dat web with Bunsen for Android 
            </td>
            <td>
              <paper-button raised style="position: relative; top: 12px;"><iron-icon icon="file-download"></iron-icon>download</paper-button>
            </td>
          </tr>
        </table>
      </div>
    </div>

`;
  }

  static get is() { return 'bunsen-app'; }
  static get properties() {
    return {
      isFocused: {
        type: Boolean,
        value: false
      }
    };
  }

  async connectedCallback() {
    super.connectedCallback()
    window.addEventListener('hashchange', () => this.hashHasChanged())
    this.gateway = `${window.location.protocol}//${window.location.host}`
    this.socket2me();
    // Handle focus on dat url input.
    this.$.address.addEventListener('focusin', () => {
      console.log("focusin")
        this.showDatSites();
    })
    // Remove spaces that keyboards add after `.` character.
    this.$.address.addEventListener('keyup', async (event) => {
      event.target.value = event.target.value.replace(' ', '')
    })
    // Listen for submit of new URL.
    this.$.address.addEventListener('keyup', async (event) => {
      if (event.keyCode !== 13) return
      this.openAddress(this.$.address.value)  
    })
    if (window.location.hash !== '') {
      this.hashHasChanged()
    }
    // Fit iframe to window.
    setInterval(() => {
      this.$.view.style.height = `${window.innerHeight - 47}px`
    }, 500)
    // Adjustments for browsers that are not Bunsen.
    if (!navigator.userAgent.includes('BunsenBrowser')) {
      // Alert folks who are not using Bunsen.
      if (!localStorage.getItem('suppressInstallBanner')) {
        this.showInstallBanner = true
      }
      try {
        // Register to handle dat:// links.
        navigator.registerProtocolHandler("dat",
          window.location+'?uri=%s',
          "Bunsen Browser");
      } catch (err) {
        // Transform dat:// Anchor tags to point at gateway.
        setInterval(() => {
          this.$.view.contentDocument.querySelectorAll('a').forEach(anchorEl => {
            let href = anchorEl.getAttribute('href')
            if (href && href.substr(0,6) === 'dat://') {
              anchorEl.setAttribute('href', `${this.gateway}/${href.substr(6, href.length)}/`)
            }
          }, 500)
        })
      }

    }

  }

  suppressInstallBanner() {
    localStorage.setItem('suppressInstallBanner', true)
  }

  showDatSites() {
      const datSites = localStorage.getItem('datSites')
      if (datSites) {
          const datSiteItems = JSON.parse(datSites)
          this.$.datSites.items = datSiteItems
      } else {
          localStorage.setItem('datSites', '[]')
      }
      this.isFocused = true
      this.$.view.style.display = 'none'
      this.$.datSites.style.display = 'block'
      this.$.peerage.style.display = 'block'
      
  }

  refresh() {
    this.openAddress(this.currentAddress)
  }

  hashHasChanged() {
      let address = window.location.hash.substr(1, window.location.hash.length)
      this.$.address.value = address
      this.openAddress(address)
  }

  async openAddress(address) {
    this.currentAddress = address

    let gatewayAddress = ''
    // Allow fallback to online gateway.
    try {
      // Make sure local dat gateway is available.
      let response = await fetch('http://localhost:3000')
      let body = await response.text()
      if (body.indexOf('dat-gateway') !== -1) {
        gatewayAddress = `http://localhost:3000/${address.replace('dat://', '')}/`
      } else {
        throw Error('localhost:3000 is not a dat gateway')
      }
    } catch (e) {
      gatewayAddress = `http://gateway.mauve.moe:3000/${address.replace('dat://', '')}/`
    }
    this.$.datSites.style.display = 'none'
    this.$.peerage.style.display = 'none'
    this.$.view.style.display = 'block'
    this.$.view.style.background = `white`
    this.$.view.src = gatewayAddress 
    this.$.address.blur()
    const datSites = localStorage.getItem('datSites')
    if (datSites) {
      const datSiteItems = JSON.parse(datSites)
      let hasAddress = false
      for (var key in datSiteItems) {
        if (datSiteItems.hasOwnProperty(key)) {
            console.log(key + " -> " + JSON.stringify(datSiteItems[key]));
            if (datSiteItems[key].address === address) {
                hasAddress = true
            }
        }
      }
      if (!hasAddress) {
          datSiteItems.unshift({ address: address })
          this.$.datSites.items = datSiteItems
          localStorage.setItem('datSites', JSON.stringify(datSiteItems))
      }
    } else {
      localStorage.setItem('datSites', `[{"address": "${address}"}]`)
    }
  }

  clearAddress() {
    this.$.address.value = ''
    // Focus back after 200 milliseconds. Delay is a quirk of animations in paper-input.
    setTimeout(() => {
      this.$.address.focus()
      this.showDatSites()
    }, 200)
  }

  socket2me() {
      const wsUrl = `ws://localhost:3000/peers`
      const socket = websocketStream(wsUrl, null, null)
      // var stream = ws('ws://localhost:8343')
      let that = this;
      socket.on('data', function (rawMsg) {
          console.log("got message: " + rawMsg);
          var str = String.fromCharCode.apply(null, rawMsg);
          let msgArray = str.split(":");
          let uuid = msgArray[0].substring(0, 6);
          let count = msgArray[msgArray.length-1];
          let formattedMsg = uuid + ": " + count + " peers";
          // let ws = document.querySelector('#peers');
          let ws = that.$.peers;
          ws.innerHTML = formattedMsg;
          socket.destroy()
      })
      socket.write('hello');
  }
}

window.customElements.define(BunsenApp.is, BunsenApp);
