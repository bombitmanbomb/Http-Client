export class CloudResult<T> {
	State: number;
	Content: string | { [prop: string]: unknown; [prop: number]: unknown } | T;
	Headers: { [prop: string]: string | number };
	constructor(
		Entity: T | unknown,
		state: number,
		content: { [prop: string]: unknown; [prop: number]: unknown } | string,
		resHeaders: { [prop: string]: string | number } | null
	) {
		this.State = 500;
		this.Content = "";
		this.Headers = {};
		this.CloudResult(state, content, resHeaders);
	}
	public toJSON(): string {
		return this.toString();
	}
	public toString(): string {
		return `CloudResult - State: ${this.State.toString()} Content: ${JSON.stringify(
			this.Content
		)}`;
	}
	public CloudResult(
		state: number,
		content: unknown,
		headers: { [prop: string]: string | number } | null
	): void {
		this.State = state;
		this.Headers = {};
		if (headers != null && Object.keys(headers).length > 0) {
			this.Headers = headers;
		}
		this.Content = content as T;
		if (!this.IsError) return;
		if (content == null) return;
		try {
			this.Content = JSON.parse(content as string).error;
		} catch (error) {
			this.Content = content as string;
		}
	}
	public get Entity(): T {
		return (this.Content as unknown) as T;
	}
	public get IsOK(): boolean {
		if (this.State < 200 || this.State >= 300) return false;
		return true;
	}
	public get IsError(): boolean {
		return !this.IsOK;
	}
	public get StatusCode(): number {
		return this.State;
	}
	public get IsSuccessStatusCode(): boolean {
		return this.IsOK;
	}
}
