"""Locución del vídeo v2: genera un WAV por frase de script.json con TTS local
(sherpa-onnx + Kokoro v1.0, voz española ef_dora) y escribe out/vo/durations.json.

Modelos (se descargan una vez, ver README):
  KOKORO_DIR=…/kokoro-multi-lang-v1_0  python3 voice.py
"""
import json, os, sys
import sherpa_onnx, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'vo')
d = os.environ.get('KOKORO_DIR', os.path.join(HERE, 'models', 'kokoro-multi-lang-v1_0')) + '/'
script = json.load(open(os.path.join(HERE, 'script.json'), encoding='utf-8'))
os.makedirs(OUT, exist_ok=True)

tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
        model=d + 'model.onnx', voices=d + 'voices.bin', tokens=d + 'tokens.txt',
        data_dir=d + 'espeak-ng-data', dict_dir=d + 'dict',
        lexicon=d + 'lexicon-us-en.txt,' + d + 'lexicon-zh.txt', lang='es'),
    num_threads=os.cpu_count() or 4)))

v = script['voice']
durations = {}
only = set(sys.argv[1:])
for line in script['lines']:
    path = os.path.join(OUT, line['id'] + '.wav')
    if only and line['id'] not in only and os.path.exists(path):
        durations[line['id']] = sf.info(path).duration
        continue
    text = line['text']
    for k, rep in script['pronunciation'].items():
        text = text.replace(k, rep)
    audio = tts.generate(text, sid=v['sid'], speed=line.get('speed', v['speed']))
    sf.write(path, audio.samples, audio.sample_rate)
    durations[line['id']] = len(audio.samples) / audio.sample_rate
    print(f"{line['id']}  {durations[line['id']]:5.2f}s  {line['text']}", flush=True)
json.dump(durations, open(os.path.join(OUT, 'durations.json'), 'w'), indent=1)
