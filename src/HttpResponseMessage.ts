import type { HttpMethod } from "./HttpMethod";
export class HttpResponseMessage<T> {
	Headers: { [prop: string]: string | number };
	Content: unknown;
	Method: HttpMethod;
	RequestUri: string;
	constructor($b: Response) {
		this.Headers = $b.headers;
		this.Content = $b.content;
		this.Method = $b.method;
		this.RequestUri = $b.requestUri;
	}
}
interface Response {
	headers: { [prop: string]: string | number };
	content: unknown;
	method: HttpMethod;
	requestUri: string;
}
