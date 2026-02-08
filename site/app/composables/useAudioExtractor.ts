export function useAudioExtractor() {
	const worker = ref<Worker | null>(null);
	const isProcessing = ref(false);
	const progress = ref(0);
	const stage = ref("");
	const error = ref<string | null>(null);
	const errorType = ref<
		| "format_error"
		| "memory_error"
		| "file_error"
		| "decode_error"
		| "worker_error"
		| null
	>(null);
	const retryCount = ref(0);
	const maxRetries = 2;

	const initializeWorker = () => {
		if (worker.value) {
			return worker.value;
		}

		try {
			worker.value = new Worker(
				new URL("@/app/workers/audio-worker.ts", import.meta.url),
				{ type: "module" },
			);

			return worker.value;
		} catch (err) {
			error.value = `Failed to initialize worker: ${err}`;
			console.error("[AudioExtractor] Failed to initialize worker:", err);
			return null;
		}
	};

	const extractAudioFromVideo = async (file: File): Promise<Blob> => {
		if (!file.type.startsWith("video/")) {
			throw new Error("File must be a video file");
		}

		error.value = null;
		isProcessing.value = true;
		progress.value = 0;
		stage.value = "準備中...";

		const audioWorker = initializeWorker();
		if (!audioWorker) {
			throw new Error("Failed to initialize audio worker");
		}

		audioWorker.onmessage = (event: MessageEvent) => {
			const message = event.data;

			switch (message.type) {
				case "progress":
					progress.value = message.percentage;
					stage.value = message.stage;
					break;
				case "result":
					break;
				case "error":
					error.value = message.error;
					isProcessing.value = false;
					break;
			}
		};

		audioWorker.onerror = (event) => {
			error.value = `Worker error: ${event.message}`;
			isProcessing.value = false;
			console.error("[AudioExtractor] Worker error:", event);
		};

		try {
			stage.value = "音声データを読み込み中...";
			progress.value = 10;

			const arrayBuffer = await file.arrayBuffer();
			progress.value = 20;

			stage.value = "音声をデコード中...";
			progress.value = 25;

			const audioContext =
				new // biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
				(window.AudioContext || (window as any).webkitAudioContext)({
					sampleRate: 16000,
				});

			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			progress.value = 35;

			stage.value = "音声を変換中...";
			progress.value = 40;

			const targetSampleRate = 16000;
			const offlineContext = new OfflineAudioContext(
				1,
				audioBuffer.duration * targetSampleRate,
				targetSampleRate,
			);

			const source = offlineContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(offlineContext.destination);
			source.start();

			const resampledBuffer = await offlineContext.startRendering();
			progress.value = 45;

			stage.value = "MP3エンコード準備中...";

			const samples = resampledBuffer.getChannelData(0);

			return new Promise((resolve, reject) => {
				audioWorker.onmessage = (event: MessageEvent) => {
					const message = event.data;

					switch (message.type) {
						case "progress":
							progress.value = message.percentage;
							stage.value = message.stage;
							break;
						case "result":
							resolve(new Blob([message.mp3Buffer], { type: "audio/mpeg" }));
							isProcessing.value = false;
							break;
						case "error":
							reject(new Error(message.error));
							isProcessing.value = false;
							break;
					}
				};

				audioWorker.postMessage({
					type: "encode",
					samples,
					sampleRate: targetSampleRate,
					channels: 1,
					bitrate: 128,
				} as const);
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			error.value = errorMessage;

			if (
				errorMessage.includes("format") ||
				errorMessage.includes("unsupported")
			) {
				errorType.value = "format_error";
			} else if (
				errorMessage.includes("memory") ||
				errorMessage.includes("too large")
			) {
				errorType.value = "memory_error";
			} else if (
				errorMessage.includes("decode") ||
				errorMessage.includes("audio data")
			) {
				errorType.value = "decode_error";
			} else if (errorMessage.includes("Worker")) {
				errorType.value = "worker_error";
			} else {
				errorType.value = "file_error";
			}

			isProcessing.value = false;
			throw err;
		}
	};

	const cancel = () => {
		if (worker.value) {
			worker.value.terminate();
			worker.value = null;
			isProcessing.value = false;
			progress.value = 0;
			stage.value = "";
		}
	};

	onUnmounted(() => {
		if (worker.value) {
			worker.value.terminate();
		}
	});

	const getErrorMessage = (type: typeof errorType.value): string => {
		switch (type) {
			case "format_error":
				return "ファイル形式が対応していません。MP4, MP3, WAV形式のファイルをアップロードしてください。";
			case "memory_error":
				return "ファイルが大きすぎるか、メモリが不足しています。ブラウザを再起動するか、小さいファイルをお試しください。";
			case "decode_error":
				return "音声データのデコードに失敗しました。ファイルが破損している可能性があります。";
			case "worker_error":
				return "音声変換処理でエラーが発生しました。もう一度お試しください。";
			case "file_error":
				return "ファイルの読み込みに失敗しました。ファイルを再選択してください。";
			default:
				return "音声抽出に失敗しました。動画のみアップロードします。";
		}
	};

	const retryExtraction = async (file: File) => {
		if (retryCount.value >= maxRetries) {
			throw new Error("最大リトライ回数に達しました。");
		}

		retryCount.value++;
		error.value = null;
		errorType.value = null;

		await new Promise((resolve) => setTimeout(resolve, 1000));
		return extractAudioFromVideo(file);
	};

	return {
		isProcessing: readonly(isProcessing),
		progress: readonly(progress),
		stage: readonly(stage),
		error: readonly(error),
		errorType: readonly(errorType),
		retryCount: readonly(retryCount),
		extractAudioFromVideo,
		retryExtraction,
		cancel,
		getErrorMessage,
	};
}
