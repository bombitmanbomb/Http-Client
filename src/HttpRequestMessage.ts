import type { HeadersInit, BodyInit } from "node-fetch";
import type { HttpMethod } from "./HttpMethod";
export class HttpRequestMessage {
	Headers: HeadersInit;
	Content: BodyInit | null;
	Method: HttpMethod;
	RequestUri: string;
	constructor(method: HttpMethod, uri: string) {
		this.Headers = {
			Accept: "application/json",
		};
		this.Content = null;
		this.Method = method;
		this.RequestUri = uri;
	}
}
