# Legal Assistant Service

A gRPC-based microservice for legal document question answering.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate gRPC code:
```bash
python -m grpc_tools.protoc -I./protos --python_out=./app --grpc_python_out=./app ./protos/legal_assistant.proto
```

3. Start the server:
```bash
python -m app.main
```

## Testing

Run all tests:
```bash
python -m pytest tests/
```

Run specific test file:
```bash
python -m pytest tests/test_grpc_client.py
```

## API Documentation

### Services

1. AskQuestion
   - Input: QuestionRequest (query: string)
   - Output: Stream of QuestionResponse (text: string, references: List[string])

2. HealthCheck
   - Input: HealthCheckRequest
   - Output: HealthCheckResponse (status: string, timestamp: double)

## Usage Example

See `test_client.py` for usage examples.