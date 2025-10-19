import cv2
from deepface import DeepFace

# --- NEW SUGGESTION FUNCTION ---
def generate_video_suggestions(data):
    suggestions = []
    
    if data["dominant_emotion"] == "No face detected":
        return ["Setup: Ensure you are well-lit and your face is fully within the camera frame."]
    
    dominant = data["dominant_emotion"].lower()
    smile_percentage = int(data["smile"].replace('%', ''))

    # 1. Negative Emotion Suggestions
    if dominant in ['sad', 'fear', 'disgust', 'anger']:
        suggestions.append(f"Expression: Your dominant emotion was **{dominant.capitalize()}**. Practice maintaining a neutral, pleasant face.")

    # 2. Composure/Smile Suggestions
    if dominant == 'happy' and smile_percentage >= 70:
        suggestions.append("Composure: Your high smile percentage suggests laughter or over-expression. Aim for a subtle, professional smile.")
    elif smile_percentage < 15:
        suggestions.append("Approachability: Your smile percentage was low. A slight, consistent smile can greatly improve your approachability.")
    
    # 3. Excellent Performance
    if not suggestions:
        suggestions.append("Your facial expressions and confidence were excellent! Maintain this professional and composed demeanor.")
        
    return suggestions


def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    analyzed_frames = 0
    happy_frames = 0 
    emotions = []
    
    # Efficiency Configuration
    MAX_FRAMES_TO_READ = 50 
    FRAME_SKIP = 5          

    while True:
        ret, frame = cap.read()
        if not ret or frame_count >= MAX_FRAMES_TO_READ:
            break
            
        if frame_count % FRAME_SKIP == 0:
            analyzed_frames += 1
            try:
                analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, silent=True)
                dominant_emotion = analysis[0]['dominant_emotion']
                emotions.append(dominant_emotion)
                
                if dominant_emotion.lower() == 'happy':
                    happy_frames += 1
            except:
                pass
                
        frame_count += 1

    cap.release()
    
    if analyzed_frames == 0:
        # Return base failure result
        return {
            "dominant_emotion": "No face detected", 
            "feedback": "Please ensure your face is visible on camera.",
            "smile": "0%",
            "suggestions": generate_video_suggestions({"dominant_emotion": "No face detected", "smile": "0%"})
        }

    # Calculate results
    dominant = max(set(emotions), key=emotions.count) if emotions else "Neutral"
    smile_percentage = int((happy_frames / analyzed_frames) * 100)
    
    # 2. Generate Feedback/Confidence Message
    feedback_message = f"You appeared mostly {dominant}. Try adjusting expression if needed."
    
    if dominant.lower() in ['neutral', 'happy'] and smile_percentage < 70:
        feedback_message = "Excellent confidence. Your expression was calm and attentive."
    elif dominant.lower() == 'happy' and smile_percentage >= 70:
        feedback_message = "High confidence, but maintain composure. Excessive smiling can distract from professional focus."
    elif dominant.lower() in ['sad', 'fear', 'disgust', 'anger']:
        feedback_message = f"Focus on maintaining a neutral or positive expression. Dominant emotion was {dominant}."
    else:
        feedback_message = f"Your expression was mostly {dominant}. Aim for a calm and attentive demeanor."

    # Assemble results
    results = {
        "dominant_emotion": dominant.capitalize(),
        "feedback": feedback_message,
        "smile": f"{smile_percentage}%"
    }
    
    # --- GENERATE SUGGESTIONS ---
    results["suggestions"] = generate_video_suggestions(results)
    
    return results