import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
from async_lru import alru_cache

class AIModelManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIModelManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name_small = "intfloat/multilingual-e5-small"
        # large model can be added later as per spec
        
        print(f"Loading AI Model: {self.model_name_small} on {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name_small)
        self.model = AutoModel.from_pretrained(self.model_name_small).to(self.device)
        self.initialized = True

    @alru_cache(maxsize=128)
    async def get_embedding(self, text: str):
        # Implementation of E5 embedding
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        
        # Mean pooling
        embeddings = outputs.last_hidden_state.mean(dim=1)
        return embeddings.cpu().numpy()

    def predict_risk(self, text: str):
        # Placeholder for 2-stage inference logic with LightGBM
        # For now, return a mock score
        import random
        return random.uniform(0, 100)

model_manager = AIModelManager()
