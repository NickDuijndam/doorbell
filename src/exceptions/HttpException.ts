class HttpException extends Error {
	public status?: number;
	public message: string;
	public cause?: Error;

	constructor(status?: number, message?: string) {
		super(message);
		this.status = status;
		this.message = message || "";
	}

	withCause(e: Error): this {
		this.cause = e;

		return this;
	}
}

export default HttpException;
