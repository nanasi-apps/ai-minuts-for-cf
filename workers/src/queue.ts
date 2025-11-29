import type { Job } from "../utils/queueTypes";
import { processMinutsJob } from "./jobProcessor";

export class QueueDO implements DurableObject {
	state: DurableObjectState;
	env: Env;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === "/enqueue" && request.method === "POST") {
			const job = (await request.json()) as Job;
			await this.enqueue(job);
			return new Response(JSON.stringify({ success: true, jobId: job.id }), {
				status: 200,
			});
		}

		if (path === "/dequeue" && request.method === "GET") {
			const job = await this.dequeue();
			return new Response(JSON.stringify(job), { status: 200 });
		}

		if (path === "/complete" && request.method === "POST") {
			const { id } = (await request.json()) as { id: string };
			await this.complete(id);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		if (path === "/retry" && request.method === "POST") {
			const { id, error } = (await request.json()) as {
				id: string;
				error: string;
			};
			await this.retry(id, error);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		if (path === "/fail" && request.method === "POST") {
			const { id, error } = (await request.json()) as {
				id: string;
				error: string;
			};
			await this.fail(id, error);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	}

	async alarm() {
		const job = await this.dequeue();
		if (job) {
			console.log(`[QueueDO] Alarm fired. Processing job ${job.id}`);
			await this.processJob(job);

			// Check if there are more jobs waiting
			const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
			if (jobs.some((j) => j.status === "waiting")) {
				console.log("[QueueDO] More jobs waiting. Scheduling next alarm.");
				await this.state.storage.setAlarm(Date.now() + 100);
			}
		}
	}

	async enqueue(job: Job) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		jobs.push(job);
		await this.state.storage.put("jobs", jobs);
		console.log(`[QueueDO] Enqueued job ${job.id}`);
		// Schedule alarm if not already scheduled
		const currentAlarm = await this.state.storage.getAlarm();
		const alarmTime = currentAlarm
			? new Date(currentAlarm).toLocaleString("ja-JP", {
					timeZone: "Asia/Tokyo",
				})
			: "null";
		console.log(`[QueueDO] Current alarm: ${alarmTime}`);
		if (currentAlarm === null || currentAlarm < Date.now()) {
			console.log("[QueueDO] Scheduling alarm (new or resetting stuck alarm).");
			await this.state.storage.deleteAlarm(); // Clear just in case
			await this.state.storage.setAlarm(Date.now() + 100); // Set for immediate future
		}
	}

	async dequeue(): Promise<Job | null> {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const nextJob = jobs.find((j) => j.status === "waiting");
		if (nextJob) {
			nextJob.status = "processing";
			nextJob.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
			return nextJob;
		}
		return null;
	}

	async complete(id: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "done";
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

	async retry(id: string, error: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "waiting"; // Reset to waiting
			job.retryCount = (job.retryCount || 0) + 1;
			job.error = error; // Log the error that caused retry
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

	async fail(id: string, error: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "failed";
			job.error = error;
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

        async processJob(job: Job) {
                console.log(
                        `Processing job ${job.id} for minutsId: ${job.payload.minutsId}`,
                );

                try {
                        await processMinutsJob(this.env, job);
                        await this.complete(job.id);
                } catch (e) {
                        console.error(`Job failed: ${e}`);

                        // Retry logic
                        if ((job.retryCount || 0) < 3) {
                                console.log(
                                        `Retrying job ${job.id} (attempt ${(job.retryCount || 0) + 1})`,
                                );
                                await this.retry(job.id, String(e));

                                // Reschedule alarm for retry
                                await this.state.storage.setAlarm(Date.now() + 1000);
                        } else {
                                console.error(`Job ${job.id} failed after 3 attempts`);
                                // Update status in D1 to FAILED
                                try {
                                        await this.env.ai_minuts
                                                .prepare("UPDATE Minuts SET status = ? WHERE id = ?")
                                                .bind("FAILED", job.payload.minutsId)
                                                .run();
                                } catch (dbError) {
                                        console.error("Failed to update D1 status:", dbError);
                                }

                                // Fail job
                                await this.fail(job.id, String(e));
                        }
                }
        }
}
