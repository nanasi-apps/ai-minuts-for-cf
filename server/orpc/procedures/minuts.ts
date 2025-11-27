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

			const getMp3FromR2 = async () => {
				const minuts = await context.db.minuts.findUnique({
					where: {
						id: minutsId,
					},
				});

				if (!minuts || !minuts.videoKey) {
					throw new ORPCError("NOT_FOUND", {
						message: "議事録が見つかりません",
					});
				}

				const object = await context.r2.get(minuts.videoKey);

				if (!object) {
					throw new ORPCError("NOT_FOUND", {
						message: "ファイルが見つかりません",
					});
				}

				const buffer = await object.arrayBuffer();
				const body = new Uint8Array(buffer);

				return {
					body,
					contentType: object.httpMetadata?.contentType || "audio/mpeg",
					filename: minuts.title,
				};
			};

			const audioData = await getMp3FromR2();

			if (audioData.body.byteLength === 0) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "取得した音声ファイルが空です",
				});
			}

			console.log("Starting Nova-3 processing...");

			interface Nova3Word {
				word: string;
				start: number;
				end: number;
				confidence: number;
				speaker?: number;
			}

			interface UserSampleWord {
				text: string;
				start: number;
				end: number;
				speaker: number;
				confidence?: number;
			}

			interface Nova3Response {
				// Structure based on Cloudflare docs
				results?: {
					channels?: Array<{
						alternatives?: Array<{
							words?: Nova3Word[];
							transcript: string;
							confidence: number;
						}>;
					}>;
				};
				// Structure based on user provided sample
				result?: {
					transcript?: UserSampleWord[];
				};
			}

			const novaResponse = (await context.ai.run("@cf/deepgram/nova-3", {
				audio: {
					body: audioData.body,
					contentType: audioData.contentType,
				},
				detect_language: true,
				diarize: true,
				smart_format: true,
			})) as Nova3Response;

			let words: Nova3Word[] = [];

			if (novaResponse.results?.channels?.[0]?.alternatives?.[0]?.words) {
				words = novaResponse.results.channels[0].alternatives[0].words;
			} else if (novaResponse.result?.transcript) {
				words = novaResponse.result.transcript.map((t) => ({
					word: t.text,
					start: t.start,
					end: t.end,
					confidence: t.confidence || 1.0, // Default confidence if missing in this format
					speaker: t.speaker,
				}));
			}

			type Segment = {
				author: string;
				transcript: string;
				time: { start: number; end: number };
				confidence: number;
			};

			const segments: Segment[] = [];
			let currentSegment: Segment | null = null;
			let currentConfidenceSum = 0;
			let currentWordCount = 0;

			for (const word of words) {
				const speaker =
					word.speaker !== undefined
						? `Speaker ${word.speaker}`
						: "Unknown Speaker";

				if (currentSegment && currentSegment.author === speaker) {
					currentSegment.transcript += ` ${word.word}`;
					currentSegment.time.end = word.end;
					currentConfidenceSum += word.confidence;
					currentWordCount++;
					currentSegment.confidence = currentConfidenceSum / currentWordCount;
				} else {
					if (currentSegment) {
						segments.push(currentSegment);
					}
					currentConfidenceSum = word.confidence;
					currentWordCount = 1;
					currentSegment = {
						author: speaker,
						transcript: word.word,
						time: {
							start: word.start,
							end: word.end,
						},
						confidence: word.confidence,
					};
				}
			}
			if (currentSegment) {
				segments.push(currentSegment);
			}

			const transcript = segments
				.map((s) => `${s.author}: ${s.transcript}`)
				.join("\n");

			const systemPrompt = `
You are an excellent meeting minutes assistant.
Please create clear, structured meeting minutes based on the following “meeting transcription text.”

## Requirements
1. **Speaker Identification**: Distinguish speakers as much as possible based on context and tone (e.g., Speaker A, Speaker B...). Use names when identifiable.
2. **Summary**: Summarize the meeting to provide an overview.
3. **Decisions**: List decisions and agreements made in bullet points.
4. **Next Actions**: Extract any tasks that need to be done going forward.

Please output in Markdown format.
`;

			interface LlmResponse {
				response?: string;
				result?: string;
			}

			const llmResponse = (await context.ai.run(
				"@cf/meta/llama-3-8b-instruct",
				{
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: transcript },
					],
				},
			)) as LlmResponse;

			console.log("LLM Result:", JSON.stringify(llmResponse, null, 2));

			// TODO: DBに保存する処理をここに追加（現在はログ出力とレスポンスのみ）

			return {
				success: true,
				message: "処理が完了しました",
				transcript: transcript,
				segments: segments,
				summary: llmResponse.response || llmResponse.result || "",
			};
		}),
};
