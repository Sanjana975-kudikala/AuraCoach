import librosa
import speech_recognition as sr
from textblob import TextBlob

# --- NEW SUGGESTION FUNCTION ---
def generate_audio_suggestions(data):
    suggestions = []
    
    # Check for transcription error first
    if data["transcript"] == "Could not transcribe.":
        return ["Your microphone volume may be too low or background noise is too high. Ensure a quiet environment."]

    # 1. Confidence/Loudness (RMS) Suggestions
    if data["confidence"] == "Low":
        suggestions.append("Confidence: Your voice was quiet (Low RMS). Practice projecting your voice to sound more assured.")

    # 2. Clarity/Pace (Tempo) Suggestions
    if data["clarity"] == "Fast":
        suggestions.append("Clarity: Your pace was fast. Slow down your speaking tempo to ensure better clarity and comprehension.")

    # 3. Fluency/Filler Words Suggestions
    filler_count = data["filler_count"]
    if filler_count >= 3:
        suggestions.append(f"Fluency: You used {filler_count} filler words (e.g., 'um', 'like'). Use short pauses instead of fillers to sound more articulate.")

    # 4. Emotion/Tone Suggestions
    if data["emotion"].startswith("Negative"):
        suggestions.append("Tone: Your tone suggested a slightly negative sentiment. Focus on using positive language and an upward inflection.")

    # 5. Proficiency/Length Suggestions
    if data["proficiency_level"].startswith("Basic"):
        suggestions.append("Proficiency: Your answers were very brief. Try expanding on your points to demonstrate deeper knowledge.")
        
    if not suggestions:
        suggestions.append("Your voice performance was excellent! Maintain this strong command of pace, tone, and confidence.")

    return suggestions

def analyze_audio(audio_path):
    y, sr_rate = librosa.load(audio_path)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr_rate)
    rms = librosa.feature.rms(y=y).mean()

    # Speech-to-text
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
        except:
            text = "Could not transcribe."

    sentiment = TextBlob(text).sentiment.polarity
    
    # --- ANALYSIS METRICS ---
    
    # 1. EMOTION
    emotion = "Positive 😊" if sentiment > 0 else "Negative 😞" if sentiment < 0 else "Neutral 😐"

    # 2. CONFIDENCE & CLARITY
    confidence = "High" if rms > 0.05 else "Low"
    clarity = "Good" if tempo < 160 else "Fast"
    
    # 3. PROFICIENCY
    text_length = len(text.split())
    
    if text == "Could not transcribe.":
        proficiency = "Unknown"
    elif text_length < 5:
        proficiency = "Basic (Too brief)"
    elif text_length > 20 and sentiment > 0.3:
        proficiency = "Advanced"
    elif text_length > 10 and sentiment >= -0.1:
        proficiency = "Intermediate"
    else:
        proficiency = "Intermediate"
        
    length_feedback = f"{text_length} words"
    
    # 4. FLUENCY
    filler_words = ["um", "uh", "like", "so", "you know", "i mean", "actually"]
    filler_count = sum(text.lower().count(word) for word in filler_words)
    
    if text_length > 0:
        penalty = min(filler_count * 10, 50) 
        fluency_score = max(100 - penalty, 50)
    else:
        fluency_score = 0
    
    # --- ASSEMBLE RESULTS ---
    results = {
        "transcript": text,
        "confidence": confidence,
        "clarity": clarity,
        "emotion": emotion,
        "proficiency_level": proficiency,
        "transcript_length": length_feedback,
        "fluency_score": f"{fluency_score}%", 
        "filler_count": filler_count
    }
    
    # --- GENERATE SUGGESTIONS ---
    results["suggestions"] = generate_audio_suggestions(results)
    
    return results