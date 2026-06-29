1. Upgrade pip
   pip install --upgrade pip

Why?

Better dependency resolution
Faster installs
Fewer package conflicts

2. Install LangChain
   pip install langchain langchain-community
   What is LangChain?

Think of it as the orchestrator.

Without LangChain, you'd manually write code like:

Read file
↓

Split text
↓

Generate embeddings
↓

Search vectors
↓

Create prompt
↓

Send prompt to LLM
↓

Return answer

LangChain packages these recurring patterns into reusable building blocks like:

Document loaders
Text splitters
Retrievers
Chains
Memory 3. Install the embedding libraries
pip install sentence-transformers transformers huggingface_hub

These are often confused, so here's the distinction:

transformers

Downloads and runs transformer models (e.g., BERT, Llama, Gemma).

sentence-transformers

Built on top of transformers and specialized for embeddings.

Example:

"This company offers paid leave."

becomes something like:

[0.21,
-0.13,
0.77,
...
384 numbers]

These vectors capture the semantic meaning of the text.

huggingface_hub

Handles downloading and caching models from Hugging Face.

The first time you use a model, it downloads it. Subsequent runs use the local cache.

4. Install ChromaDB
   pip install chromadb

ChromaDB is your local vector database.

Instead of storing text directly, it stores vectors:

Sentence
↓

Embedding

↓

[0.15, 0.44, ...]

Later, when you ask a question, ChromaDB finds the most similar vectors instead of doing a simple keyword search.

5. Install Ollama integration

We'll be using a local LLM instead of IBM for now.

pip install langchain-ollama

Later, if you want to use IBM again, you can simply install:

pip install ibm-watsonx-ai langchain-ibm

The rest of your RAG pipeline stays the same.

6. Install PyTorch

For Apple Silicon, don't use the CPU-specific install from the IBM notebook:

pip install --upgrade torch --index-url https://download.pytorch.org/whl/cpu

That command is intended for Intel/CPU environments.

On your M1 Mac, just run:

pip install torch torchvision torchaudio

PyTorch automatically uses Apple's Metal Performance Shaders (MPS) backend when available.

7. Install helpful utilities
   pip install wget python-dotenv
   wget is used in the IBM lab to download the sample text file.
   python-dotenv lets you keep API keys in a .env file, which is useful when we later switch to cloud providers.
   Verify the installation

Run:

pip list

You should see packages such as:

langchain
langchain-community
sentence-transformers
transformers
chromadb
torch
langchain-ollama
python-dotenv
wget

You don't need the exact same versions as the IBM notebook.

Save your environment

Create a requirements.txt:

pip freeze > requirements.txt

This captures the exact versions installed on your machine, making it easy to recreate the environment later.

Why we're not installing IBM packages yet

The IBM notebook starts with:

ibm-watsonx-ai
langchain-ibm

Those packages are only necessary if you're calling IBM's hosted models.

For our local setup:

Embedding model → local
Vector database → local
LLM → local (Ollama)

That means we can get the entire RAG pipeline working without any cloud dependencies. Once it's working, swapping the LLM to IBM, Gemini, or Groq is just a matter of changing the model integration code.
