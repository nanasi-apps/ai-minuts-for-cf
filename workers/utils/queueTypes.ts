export interface Job {
	id: string;
	status: "waiting" | "processing" | "retrying" | "failed" | "done";
	payload: {
		minutsId: number;
		action?: "transcribe_and_summarize" | "summarize_only";
	};
	createdAt: number;
	updatedAt: number;
	retryCount: number;
	error?: string;
}

export interface EnqueueResponse {
	success: boolean;
	jobId: string;
	message: string;
}
