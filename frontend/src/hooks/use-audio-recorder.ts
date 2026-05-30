"use client";

import { useState, useRef } from "react";

const MAX_RECORDING_DURATION_MS = 30_000;
const RECORDER_MIME_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/webm",
];
const SPEECHKIT_SAMPLE_RATE = 16_000;

async function convertToSpeechKitLpcm(blob: Blob) {
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const channelData = audioBuffer.getChannelData(0);
    const sampleRateRatio = audioBuffer.sampleRate / SPEECHKIT_SAMPLE_RATE;
    const samplesCount = Math.floor(channelData.length / sampleRateRatio);
    const pcmBuffer = new ArrayBuffer(samplesCount * 2);
    const pcmView = new DataView(pcmBuffer);

    for (let index = 0; index < samplesCount; index += 1) {
      const sourceIndex = Math.min(Math.floor(index * sampleRateRatio), channelData.length - 1);
      const sample = Math.max(-1, Math.min(1, channelData[sourceIndex]));
      pcmView.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return new Blob([pcmBuffer], { type: "audio/lpcm" });
  } finally {
    await audioContext.close();
  }
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        try {
          setAudioBlob(await convertToSpeechKitLpcm(blob));
        } catch (error) {
          console.error("Failed to convert audio to SpeechKit LPCM:", error);
          setAudioBlob(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
        recordingTimeoutRef.current = null;
      }, MAX_RECORDING_DURATION_MS);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, audioBlob, startRecording, stopRecording, setAudioBlob };
}
