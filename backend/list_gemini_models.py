import google.generativeai as genai
import os

# 🔑 Set your API key here
os.environ["GOOGLE_API_KEY"] = "AIzaSyBIwFtZtouc_77OVtCbOghXZeTG7wJMZ0U"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

print("🔍 Fetching available models for your API key...\n")

try:
    models = list(genai.list_models())
    for m in models:
        print(f"✅ {m.name}")
except Exception as e:
    print("❌ Error fetching models:", e)
