# from dotenv import load_dotenv
# import os

# from langchain_google_genai import ChatGoogleGenerativeAI

# load_dotenv()

# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash",
#     temperature=0.3,
#     api_key=os.getenv("GOOGLE_API_KEY")
# )

# response = llm.invoke("What is Retrieval-Augmented Generation in one sentence?")

# print(response.content)

from src.llm import get_llm

llm = get_llm()

response = llm.invoke(
    "Say hello in one sentence."
)

print(response.content)