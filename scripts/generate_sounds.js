const fs = require('fs');
const path = require('path');

const sampleRate = 44100;

function createWavHeader(dataLength, sampleRate = 44100, channels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function writeSound(filename, durationSec, sampleGenerator) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = sampleGenerator(t, durationSec);
    sample = Math.max(-1, Math.min(1, sample));
    const intVal = Math.floor(sample * 32767);
    data.writeInt16LE(intVal, i * 2);
  }

  const header = createWavHeader(data.length, sampleRate);
  const outputDir = path.join(__dirname, '..', 'assets', 'sounds');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, Buffer.concat([header, data]));
  console.log(`Generated ${filename} (${(fs.statSync(filepath).size / 1024).toFixed(1)} KB)`);
}

// 1. Chime: Dual pleasant sparkling chime (E5 659Hz + B5 987Hz)
writeSound('chime.wav', 2.0, (t, dur) => {
  const env1 = Math.exp(-t * 2.8);
  const env2 = t > 0.15 ? Math.exp(-(t - 0.15) * 3.2) : 0;
  const s1 = Math.sin(2 * Math.PI * 659.25 * t) * env1;
  const s2 = t > 0.15 ? Math.sin(2 * Math.PI * 987.77 * (t - 0.15)) * env2 : 0;
  const s3 = t > 0.3 ? Math.sin(2 * Math.PI * 1318.5 * (t - 0.3)) * Math.exp(-(t - 0.3) * 3.5) : 0;
  return (s1 * 0.4 + s2 * 0.4 + s3 * 0.3);
});

// 2. Gentle Bell: Warm singing bowl / soft bell
writeSound('gentle_bell.wav', 2.5, (t, dur) => {
  const env = Math.exp(-t * 1.6);
  const fund = Math.sin(2 * Math.PI * 528 * t); // 528Hz Solfeggio / miracle tone
  const overtone = Math.sin(2 * Math.PI * 1056 * t) * 0.35;
  const shimmer = Math.sin(2 * Math.PI * 1584 * t) * 0.15;
  return (fund + overtone + shimmer) * env * 0.8;
});

// 3. Digital Alarm: Classic modern electronic beeps
writeSound('digital_alarm.wav', 1.8, (t, dur) => {
  // Beep beep pattern: beep 0.15s, pause 0.1s, beep 0.15s, pause 0.4s (repeats)
  const cycle = t % 0.8;
  const isBeep1 = cycle < 0.15;
  const isBeep2 = cycle >= 0.25 && cycle < 0.40;
  if (!isBeep1 && !isBeep2) return 0;
  const tone = Math.sin(2 * Math.PI * 880 * t) + 0.3 * Math.sin(2 * Math.PI * 1760 * t);
  return tone * 0.6;
});

// 4. Zen Gong: Deep calming gong
writeSound('zen_gong.wav', 3.0, (t, dur) => {
  const env = Math.exp(-t * 1.2);
  const low = Math.sin(2 * Math.PI * 216 * t);
  const mid = Math.sin(2 * Math.PI * 432 * t) * 0.4;
  const high = Math.sin(2 * Math.PI * 648 * t) * 0.2;
  return (low + mid + high) * env * 0.85;
});

// 5. Radar: Clean upward chirp sonar ping
writeSound('radar.wav', 1.5, (t, dur) => {
  const cycle = t % 0.75;
  if (cycle > 0.25) return 0;
  const progress = cycle / 0.25;
  const freq = 600 + progress * 800; // 600Hz -> 1400Hz
  const env = Math.sin(progress * Math.PI);
  return Math.sin(2 * Math.PI * freq * cycle) * env * 0.75;
});
