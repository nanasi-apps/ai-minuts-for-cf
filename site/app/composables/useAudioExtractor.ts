export function useAudioExtractor() {
	const worker = ref<Worker | null>(null);
	const isProcessing = ref(false);
	const progress = ref(0);
	const stage = ref("");
	const error = ref<string | null>(null);

	const initializeWorker = () => {
		if (worker.value) {
			return worker.value;
		}

		try {
			worker.value = new Worker(
				new URL("@/app/workers/audio-worker.ts", import.meta.url),
				{ type: "module" },
			);

			worker.value.onmessage = (event: MessageEvent) => {
				const message = event.data;

				switch (message.type) {
					case "progress":
						progress.value = message.percentage;
						stage.value = message.stage;
						break;
					case "result":
						return message.mp3Buffer;
					case "error":
						error.value = message.error;
						break;
				}
			};

			worker.value.onerror = (event) => {
				error.value = `Worker error: ${event.message}`;
				console.error("[AudioExtractor] Worker error:", event);
			};

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
			error.value = err instanceof Error ? err.message : String(err);
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

	return {
		isProcessing: readonly(isProcessing),
		progress: readonly(progress),
		stage: readonly(stage),
		error: readonly(error),
		extractAudioFromVideo,
		cancel,
	};
}
