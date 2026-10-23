import torch
torch.set_num_threads(1)
torch.set_num_interop_threads(1)

import whisper
import sys
import json
import warnings
import os

warnings.filterwarnings("ignore")

model = whisper.load_model("tiny")
print("READY", flush=True)

for line in sys.stdin:
    audio_path = line.strip()
    if not audio_path:
        continue
    
    try:
        result = model.transcribe(audio_path, fp16=False)
        print(json.dumps({
            "file": audio_path,
            "text": result["text"].strip()
        }), flush=True)
    except Exception as e:
        print(json.dumps({
            "file": audio_path,
            "error": str(e)
        }), flush=True)