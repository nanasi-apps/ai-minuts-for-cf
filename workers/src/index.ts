import type { Job } from "../utils/queueTypes";
import { QueueDO } from "./queue";

export { QueueDO };

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/enqueue" && request.method === "POST") {
			const body = (await request.json()) as {
				minutsId: number;
				action?: Job["payload"]["action"];
				fileUrl?: string;
			};
			const { minutsId, action, fileUrl } = body;
			console.log("Enqueue request for minutsId:", minutsId);

			if (!minutsId) {
				console.error("minutsId is missing in the request body");
				return new Response("Missing minutsId", { status: 400 });
			}

			const id = crypto.randomUUID();
			const job: Job = {
				id,
				status: "waiting",
				payload: { minutsId, action, fileUrl },
				createdAt: Date.now(),
				updatedAt: Date.now(),
				retryCount: 0,
			};

			// Get DO stub
			const idObj = env.QUEUE_DO.idFromName("default-queue");
			const stub = env.QUEUE_DO.get(idObj);
			console.log("Sending job to Queue DO:", job);
			return stub.fetch(
				new Request("http://do/enqueue", {
					method: "POST",
					body: JSON.stringify(job),
				}),
			);
		}

		return new Response("Worker is running", { status: 200 });
	},

	async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
		// No-op: Scheduling is now handled by Durable Object Alarms
	},
};
