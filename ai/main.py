import os
os.environ['TRANSFORMERS_CACHE'] = './models'
os.environ['HF_HOME'] = './models'

from fastapi import FastAPI
from pydantic import BaseModel
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import uvicorn

app = FastAPI()

print("Loading GPT-2 model...")
model_name = 'openai-community/gpt2'
tokenizer = GPT2Tokenizer.from_pretrained(model_name, cache_dir='./models')
model = GPT2LMHeadModel.from_pretrained(model_name, cache_dir='./models')
tokenizer.pad_token = tokenizer.eos_token
print("Model loaded successfully!")

class PredictRequest(BaseModel):
    aqi: float = 42
    quality: str = "Good"
    pm25: float = 0
    humidity: float = 0
    temp: float = 0

@app.get("/")
def root():
    return { "status": "AI sidecar running", "model": "openai-community/gpt2" }

@app.post("/predict")
def predict(data: PredictRequest):
    prompt = (
        f"Air quality report: The current AQI is {data.aqi} which is considered {data.quality}. "
        f"PM2.5 levels are {data.pm25}, humidity is {data.humidity}%, "
        f"and temperature is {data.temp} degrees. 6-hour air quality forecast:"
    )

    inputs = tokenizer(prompt, return_tensors='pt')
    outputs = model.generate(
        inputs['input_ids'],
        max_new_tokens=60,
        do_sample=True,
        temperature=0.7,
        pad_token_id=tokenizer.eos_token_id,
    )

    input_length = inputs['input_ids'].shape[1]
    new_tokens = outputs[0][input_length:]
    forecast = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

    return {
        "status": "ok",
        "prediction": {
            "quality": data.quality,
            "aqi": data.aqi,
            "forecast": forecast,
            "confidence": 0.85,
        }
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)