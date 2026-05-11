FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

# Install CPU-only PyTorch first — prevents sentence-transformers from pulling in the 5GB GPU version
RUN pip install --no-cache-dir torch==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the dependencies (torch is already satisfied, won't be reinstalled)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
