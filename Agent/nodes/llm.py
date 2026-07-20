from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import os

load_dotenv()



AZURE_API_KEY    = os.getenv("AZURE_API_KEY")
AZURE_ENDPOINT   =os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
AZURE_API_VER    = os.getenv("AZURE_API_VER")



llm = AzureChatOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    api_key=AZURE_API_KEY,
    azure_deployment=AZURE_DEPLOYMENT,
    api_version="2024-10-21",
    streaming=True,
    temperature=0
)
