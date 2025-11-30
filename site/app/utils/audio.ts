import { Mp3Encoder } from "@breezystack/lamejs";

export async function extractAudioFromVideo(file: File): Promise<Blob> {
	console.log("[Audio] Starting extraction...");
	// 1. Read the file into an ArrayBuffer
	const arrayBuffer = await file.arrayBuffer();
	console.log("[Audio] File read into ArrayBuffer");

	// 2. Decode the audio data
	const audioContext =
		new // biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
		(window.AudioContext || (window as any).webkitAudioContext)({
			sampleRate: 16000, // Request 16kHz context to help with resampling
		});

	const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
	console.log("[Audio] Audio decoded");

	// 3. Process: Convert to Mono and 16kHz (if not already)
	const targetSampleRate = 16000;
	const offlineContext = new OfflineAudioContext(
		1,
		audioBuffer.duration * targetSampleRate,
		targetSampleRate,
	);

	// Create a buffer source
	const source = offlineContext.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(offlineContext.destination);
	source.start();

	// Render
	const resampledBuffer = await offlineContext.startRendering();
	console.log("[Audio] Resampling complete");

	// 4. Encode to MP3
	return bufferToMp3(resampledBuffer);
}

function bufferToMp3(buffer: AudioBuffer): Blob {
	console.log("[Audio] Encoding to MP3...");
	const channels = 1; // Mono
	const sampleRate = buffer.sampleRate || 16000;
	const kbps = 128;

	const encoder = new Mp3Encoder(channels, sampleRate, kbps);

	const samples = buffer.getChannelData(0);
	const sampleData = new Int16Array(samples.length);

	// Convert Float32 to Int16
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
		sampleData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}

	const mp3Data: Uint8Array[] = [];
	const blockSize = 1152; // mp3 frame size

	for (let i = 0; i < sampleData.length; i += blockSize) {
		const chunk = sampleData.subarray(i, i + blockSize);
		const mp3buf = encoder.encodeBuffer(chunk);
		if (mp3buf.length > 0) {
			mp3Data.push(mp3buf);
		}
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		mp3Data.push(mp3buf);
	}

	console.log("[Audio] Encoding complete");
	return new Blob(mp3Data as unknown as BlobPart[], { type: "audio/mpeg" });
}
