const Version = "2.0.0";
import { HttpMethod } from "./HttpMethod";
import { HttpRequestMessage } from "./HttpRequestMessage";
import { CancellationTokenSource } from "./CancellationTokenSource";
import { TimeSpan } from "@bombitmanbomb/utils";
import { CloudResult } from "./CloudResult";
import { ProductInfoHeaderValue } from "./ProductInfoHeaderValue";
import { HTTP_CLIENT } from "./HTTP_CLIENT";

export { HttpMethod } from "./HttpMethod";
export { HttpRequestMessage } from "./HttpRequestMessage";
export { HttpResponseMessage } from './HttpResponseMessage';
export { CancellationTokenSource } from "./CancellationTokenSource";
export { CloudResult } from "./CloudResult";
export { ProductInfoHeaderValue } from "./ProductInfoHeaderValue";
export { HTTP_CLIENT } from "./HTTP_CLIENT";


export class Http {
	public Bot: unknown;
	public DefaultTimeout: TimeSpan;
	public ENDPOINT: string;
	public UserAgent: ProductInfoHeaderValue;
	public DEBUG_REQUESTS: boolean;
	public DEFAULT_RETRIES: number;
	public HttpClient: HTTP_CLIENT;
	private _currentAuthenticationToken: string | null;
	private _currentAuthenticationHeader: string;
	constructor(Bot?: unknown, Options?: HttpOptions) {
		this.HttpClient = new HTTP_CLIENT();
		this.Bot = Bot;
		this.ENDPOINT = Options?.ENDPOINT ?? "";
		this.DefaultTimeout =
			Options?.DefaultTimeout != null
				? Options.DefaultTimeout instanceof TimeSpan
					? (Options.DefaultTimeout as TimeSpan)
					: (new TimeSpan(Options.DefaultTimeout) as TimeSpan)
				: TimeSpan.fromSeconds(5);
		this.DEBUG_REQUESTS = Options?.DEBUG_REQUESTS ?? false;
		this.DEFAULT_RETRIES = Options?.DEFAULT_RETRIES ?? 10;
		this._currentAuthenticationHeader = Options?.AuthHeader ?? "Authorization";
		this._currentAuthenticationToken = Options?.Token ?? null;
		this.UserAgent = new ProductInfoHeaderValue(
			Options?.UserAgent ?? "CloudX",
			Options?.Version ?? Version
		);
	}
	public OnError(...err: unknown[]): void {
		if (typeof err[0] === "string") {
			throw new Error(err.toString());
		} else {
			throw err;
		}
	}
	public OnDebug(...info: unknown[]): void {
		console.log(...info);
	}
	public CreateRequest(
		resource: string,
		method: HttpMethod
	): HttpRequestMessage {
		let flag = false;
		if (!resource.startsWith("http")) {
			flag = true;
			resource = this.ENDPOINT + "/" + resource;
		}
		const httpRequestMessage = new HttpRequestMessage(method, resource);
		if (this._currentAuthenticationToken != null && flag)
			Object.defineProperty(
				httpRequestMessage.Headers,
				this._currentAuthenticationHeader,
				{ value: this._currentAuthenticationToken }
			);
		Object.defineProperty(httpRequestMessage.Headers, "UserAgent", {
			value: this.UserAgent.Value(),
		});
		return httpRequestMessage;
	}
	public AddBody(
		message: HttpRequestMessage,
		entity: unknown,
		contentType = "application/json"
	):void {
		Object.defineProperty(message.Headers, "Content-Type", {
			value: contentType,
		});
		if (entity != null) message.Content = JSON.stringify(entity);
	}
	public async RunRequest(
		requestSource: () => HttpRequestMessage,
		timeout: TimeSpan | number | null = null,
		throwOnError = false
	): Promise<CloudResult<unknown>> {
		let Timeout: TimeSpan;
		if (timeout != null) {
			if (!(timeout instanceof TimeSpan)) {
				Timeout = new TimeSpan(timeout);
			} else {
				Timeout = timeout;
			}
		} else {
			Timeout = this.DefaultTimeout;
		}
		let request;
		let result;
		let exception;
		let content;
		let result1;
		const start = new Date();
		let statusCode = 0;
		let success = false;
		try {
			let remainingRetries = this.DEFAULT_RETRIES; //lgtm [js/useless-assignment-to-local] False Positive
			let delay = 250;
			do {
				try {
					request = (await requestSource()) as HttpRequestMessage;
					const cancellationTokenSource = new CancellationTokenSource(Timeout);
					if (this.DEBUG_REQUESTS)
						this.OnDebug(request.Method, request.RequestUri, request.Content);
					result = (await await this.HttpClient.SendAsync(
						request,
						cancellationTokenSource.Token
					)) as CloudResult<unknown>;
					success = true;
					if (this.DEBUG_REQUESTS)
						this.OnDebug(request.Method, request.RequestUri, result.StatusCode);
				} catch (error2) {
					exception = error2;
				}
				statusCode = result != null ? result.StatusCode : 0;
				// Handle Error Response, Will Retry after <delay>
				if (
					result == null ||
					result.StatusCode === 429 ||
					result.StatusCode === 500
				) {
					if (result == null) {
						const req = request as HttpRequestMessage;
						this.OnDebug(
							`Exception running ${req.Method} request to ${
								req.RequestUri
							}. Remaining retries: ${remainingRetries}. Elapsed: ${
								new Date(new Date().getTime() - start.getTime()).getTime() /
								1000
							}s`
						);
					} else if (result.StatusCode == 500 && request != null)
						this.OnDebug(
							`Server Error running ${request.Method} request to ${
								request.RequestUri
							}. Remaining retries: ${remainingRetries}. Elapsed: ${
								new Date(new Date().getTime() - start.getTime()).getTime() /
								1000
							}s`
						);
					success = false;
					await TimeSpan.Delay(new TimeSpan(delay)); // Wait and then retry
					delay *= 2; // Double Retry Time
					delay = Math.min(10000, delay);
				}
			} while (!success && remainingRetries-- > 0);
			if (result == null) {
				if (!throwOnError) {
					result1 = new CloudResult(null, 0, "", {});
				} else {
					if (exception == null)
						this.OnError(
							`Failed to get response. Last status code: ${statusCode}, Exception is null, Elapsed: ${
								new Date(new Date().getTime() - start.getTime()).getTime() /
								1000
							}s`
						);
					this.OnError(exception);
				}
			} else {
				if (result.IsSuccessStatusCode) {
					if (typeof result.Content === "string") {
						content = result.Content;
					} else {
						content = result.Content;
						if (this.DEBUG_REQUESTS && request != null)
							this.OnDebug(
								`ENTITY for ${request.Method} - ${request.RequestUri}`
							);
					}
					result1 = new CloudResult(
						null,
						result.StatusCode,
						content as string,
						result.Headers
					);
				} else {
					// Bad Status Code
					result1 = new CloudResult(
						null,
						result.StatusCode,
						result.Content as string,
						null
					);
				}
			}
		} catch (ex) {
			this.OnError(ex, true); // This is a Hard Error, Request has Failed Spectacularly for some reason and will return No value, Likely braking what called it, Suggest Throw
		}
		return result1 as CloudResult<unknown>;
	}

	public GET(
		resource: string,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				return this.CreateRequest(resource, HttpMethod.Get);
			},
			timeout,
			throwOnError
		);
	}
	public POST(
		resource: string,
		entity: unknown,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				const request = this.CreateRequest(resource, HttpMethod.Post);
				if (entity != null) this.AddBody(request, entity);
				return request;
			},
			timeout,
			throwOnError
		);
	}
	public GQL(
		query: string,
		variables: { [prop: string]: unknown } | null,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				const request = this.CreateRequest("graphql", HttpMethod.Post);
				this.AddBody(request, { query, variables });
				return request;
			},
			timeout,
			throwOnError
		);
	}
	public PUT(
		resource: string,
		entity: unknown,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				const request = this.CreateRequest(resource, HttpMethod.Put);
				if (entity != null) this.AddBody(request, entity);
				return request;
			},
			timeout,
			throwOnError
		);
	}
	public PATCH(
		resource: string,
		entity: unknown,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				const request = this.CreateRequest(resource, HttpMethod.Patch);
				if (entity != null) this.AddBody(request, entity);
				return request;
			},
			timeout,
			throwOnError
		);
	}
	public DELETE(
		resource: string,
		timeout: TimeSpan | null = null,
		throwOnError = true
	): Promise<CloudResult<unknown>> {
		return this.RunRequest(
			() => {
				return this.CreateRequest(resource, HttpMethod.Delete);
			},
			timeout,
			throwOnError
		);
	}
}

interface HttpOptions {
	DefaultTimeout?: number | TimeSpan;
	ENDPOINT?: string;
	DEBUG_REQUESTS?: boolean;
	DEFAULT_RETRIES?: number;
	Token?: string;
	AuthHeader?: string;
	UserAgent?: string;
	Version?: string | number;
}
