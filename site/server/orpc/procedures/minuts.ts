import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/server";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "@/server/middlewares/auth";
import { os } from "@/server/orpc/os";
import { getS3Client } from "@/server/utils/s3";

export default {
	generatePresignedUrl: os.minuts.generatePresignedUrl
		.use(authMiddleware)
		.handler(async ({ input, context }) => {
			const config = useRuntimeConfig();
			const s3 = getS3Client();
			const key = `${context.userId}/${uuidv4()}-${input.filename}`;

			// 署名付きURLの有効期限（秒）
			const expiresIn = 60 * 5; // 5分

			try {
				const command = new PutObjectCommand({
					Bucket: config.r2BucketName,
					Key: key,
					ContentType: input.contentType,
					ContentLength: input.fileSize,
				});

				const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

				// 議事録レコードを作成
				const minuts = await context.db.minuts.create({
					data: {
						title: input.filename, // とりあえずファイル名をタイトルにする
						videoKey: key,
						userId: context.userId,
						status: "UPLOADING",
					},
				});

				return {
					uploadUrl,
					key,
					minutsId: minuts.id,
				};
			} catch (error) {
				console.error("Failed to generate presigned URL:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "アップロードURLの生成に失敗しました",
				});
			}
		}),

	list: os.minuts.list.use(authMiddleware).handler(async ({ context }) => {
		const minutsList = await context.db.minuts.findMany({
			where: {
				userId: context.userId,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return minutsList.map((m) => ({
			id: m.id,
			title: m.title,
			status: m.status,
			createdAt: m.createdAt.toISOString(),
		}));
	}),

	process: os.minuts.process
		.use(authMiddleware)
		.handler(async ({ context, input }) => {
			const minutsId = input.minutsId;

			// Check if minuts exists
			const minuts = await context.db.minuts.findUnique({
				where: {
					id: minutsId,
				},
			});

			if (!minuts) {
				throw new ORPCError("NOT_FOUND", {
					message: "議事録が見つかりません",
				});
			}

			// Enqueue job to Worker
			// We need to access the QUEUE_SERVICE binding.
			// Since it's not in the context yet, we might need to cast or access it from event.

			const { QUEUE_SERVICE } = context.event.context.cloudflare.env as Env;

			const payload = {
				minutsId,
			};

			await QUEUE_SERVICE.fetch("http://worker/enqueue", {
				method: "POST",
				body: JSON.stringify(payload),
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				success: true,
				message: "処理を開始しました。完了までしばらくお待ちください。",
			};
		}),

	get: os.minuts.get.use(authMiddleware).handler(async ({ context, input }) => {
		const minuts = await context.db.minuts.findUnique({
			where: {
				id: input.id,
				userId: context.userId,
			},
		});

		if (!minuts) {
			throw new ORPCError("NOT_FOUND", {
				message: "議事録が見つかりません",
			});
		}

		return {
			id: minuts.id,
			title: minuts.title,
			status: minuts.status,
			summary: minuts.summary ?? null,
			transcript: minuts.transcript ?? null,
			createdAt: minuts.createdAt.toISOString(),
		};
	}),

	regenerateSummary: os.minuts.regenerateSummary
		.use(authMiddleware)
		.handler(async ({ context, input }) => {
			const minutsId = input.minutsId;

			const minuts = await context.db.minuts.findUnique({
				where: {
					id: minutsId,
					userId: context.userId,
				},
			});

			if (!minuts) {
				throw new ORPCError("NOT_FOUND", {
					message: "議事録が見つかりません",
				});
			}

			if (!minuts.transcript) {
				throw new ORPCError("BAD_REQUEST", {
					message:
						"文字起こしデータが存在しません。まずは議事録を作成してください。",
				});
			}

			const { QUEUE_SERVICE } = context.event.context.cloudflare.env as Env;

			const payload = {
				minutsId,
				action: "summarize_only",
			};

			await QUEUE_SERVICE.fetch("http://worker/enqueue", {
				method: "POST",
				body: JSON.stringify(payload),
				headers: {
					"Content-Type": "application/json",
				},
			});

			// Update status to PROCESSING so the UI reflects it
			await context.db.minuts.update({
				where: { id: minutsId },
				data: { status: "PROCESSING" },
			});

			return {
				success: true,
				message: "再要約を開始しました。",
			};
		}),
};
