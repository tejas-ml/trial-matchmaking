# HelixMatch Python engine

Stdlib-only RAG matcher used by the web app's TypeScript twin.

```bash
python3 engine/demo.py --note engine/samples/nsclc.txt
python3 engine/demo.py --note engine/samples/igan.txt --top 8
```

Production swap-ins (not required to run the demo):

- Encoder: `sentence-transformers` with BioBERT (`pritamdeka/BioBERT-mnli-snli-scinli-scitail-mednli-stsb`)
- Orchestration: LangChain retrieval chain
- Store: Postgres + pgvector
- Live index: ClinicalTrials.gov API v2
