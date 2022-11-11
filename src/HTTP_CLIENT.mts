import { CloudResult } from "./CloudResult.mjs";
import fetch from "node-fetch";
import type { HttpRequestMessage } from "./HttpRequestMessage.mjs";
import type { CancellationTokenSource } from "./CancellationTokenSource.mjs";
import { HttpMethod } from "./HttpMethod.mjs";
import type { Headers } from "form-data";
export class HTTP_CLIENT {
	constructor() {}
	public async SendAsync(
		request: HttpRequestMessage,
		token: CancellationTokenSource
	): Promise<CloudResult<unknown>> {
		let state = 0;
		let resHeaders: Headers = {};
		let method = "";
		switch (request.Method) {
		case HttpMethod.Get:
			method = "GET";
			break;
		case HttpMethod.Post:
			method = "POST";
			break;
		case HttpMethod.Put:
			method = "PUT";
			break;
		case HttpMethod.Patch:
			method = "PATCH";
			break;
		case HttpMethod.Delete:
			method = "DELETE";
			break;
		case HttpMethod.GraphQL:
			method = "POST";
			break;
		}
		const dat: { [prop: string]: string | AbortSignal | unknown } = {};
		dat.method = method;
		if (token) {
			dat.signal = token.signal;
		}
		dat.headers = (request.Headers as unknown) as {};
		if (
			request.Method === HttpMethod.Post ||
			request.Method === HttpMethod.Put ||
			request.Method == HttpMethod.Patch
		)
			dat.body = request.Content as string;
		let ERROR;
		let response = await fetch(request.RequestUri, dat)
			.then((res) => {
				state = res.status;
				const tempHeaders = [...res.headers].map(([name, value]) => ({
					name,
					value,
				}));
				for (const item of tempHeaders) {
					resHeaders[item.name] = item.value;
				}
				return res.text().then((body) => {
					try {
						if (
							body == null ||
							body.trim() === "" ||
							!~resHeaders["content-type"]?.indexOf("application/json")
						) {
							return { response: body };
						}
						return JSON.parse(body);
					} catch (error) {
						console.error(error);
						return {
							response: body,
						};
					}
				});
			})
			.catch((err) => {
				ERROR = new Error(err);
				console.error(err);
			});
		if (response == null) {
			response = { error: ERROR, response: null };
			state = 500;
			resHeaders = {};
		}
		return new CloudResult(null, state, response, resHeaders);
	}
}
