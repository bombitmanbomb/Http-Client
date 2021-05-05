const AbortController = require("abort-controller");
/**.
 * Generates a Cancelation Token
 *
 * @class CancellationTokenSource
 */
class CancellationTokenSource {
	constructor(timeout) {
		/**@type {string} */
		this._cancel = false;
		this.controller = new AbortController();
		this.abort = this.abort.bind(this);
		if (timeout) {
			setTimeout(this.abort, timeout.msecs !=null ? timeout.msecs : timeout);
		}
	}
	Cancel() {
		this.abort();
	}
	get aborted() {
		return this._cancel;
	}
	get signal() {
		return this.controller.signal;
	}
	IsCancellationRequested() {
		return this._cancel;
	}
	get Token() {
		return this;
	}
	abort() {
		this._cancel = true;
		this.controller.abort();
	}
}
module.exports = {
	CancellationTokenSource,
};
