import AbortController from "abort-controller";
import { TimeSpan } from "@bombitmanbomb/utils";

export class CancellationTokenSource {
	private _cancel: boolean;
	private controller: AbortController;
	constructor(timeout: number | TimeSpan | null) {
		this._cancel = false;
		this.controller = new AbortController();
		this.abort = this.abort.bind(this);
		if (timeout != null) {
			if (typeof timeout === "number") {
				setTimeout(this.abort, timeout);
			} else {
				setTimeout(this.abort, timeout.msecs);
			}
		}
	}
	abort() {
		this._cancel = true;
		this.controller.abort();
	}
	get Token() {
		return this;
	}
	get signal() {
		return this.controller.signal;
	}
	get aborted() {
		return this._cancel;
	}
	Cancel() {
		this.abort();
	}
	IsCancellationRequested() {
		return this._cancel;
	}
}
