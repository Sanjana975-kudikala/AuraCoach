# 🎯 AuraCoach: Interview Coach  

**AuraCoach** is a full-stack **Interview Coaching Platform** that helps users **boost their confidence** by analyzing both **voice** and **non-verbal communication**.  
It provides **data-driven, personalized feedback** using advanced Python-based analytics — creating a realistic **virtual interview environment**.

---

## ✨ Key Features  

### 🗣️ **Voice Analysis**  
- **Confidence** → Measured through audio energy (**RMS / volume**)  
- **Clarity** → Based on **speaking pace and tempo**  
- **Fluency** → Detects **filler words** (e.g., “um”, “uh”)  
- **Proficiency** → Based on **vocabulary richness and speech stability**  
- **Emotional Tone** → Detected using **sentiment analysis**  

**🧩 Tech Used:** `librosa`, `SpeechRecognition`, `TextBlob`

---

### 🎥 **Video Analysis**  
- Detects **dominant facial emotion** (happy, sad, neutral, etc.)  
- Calculates **smile percentage** and **eye contact stability**  
- Evaluates **professional composure** throughout the session  

**🧩 Tech Used:** `DeepFace`, `OpenCV (cv2)`

---

### 📊 **Overall Score**  
- Combines **audio** and **visual** metrics into one **weighted score**  
- Helps users **track performance** across multiple sessions  

---

### 💡 **Smart Suggestions**  
Provides **personalized tips** like:  
> “Slow down your pace.”  
> “Avoid filler words.”  
> “Maintain eye contact.”  
> “Smile slightly to appear confident.”  

Generated using **custom backend logic** based on threshold analysis.  

---

## ⚙️ **Technology Stack**

| Component | Technology |
|------------|-------------|
| **Backend** | Python 3, Flask, Gunicorn |
| **Frontend** | HTML5, CSS, Vanilla JavaScript |
| **Core AI/ML Libraries** | DeepFace, librosa, SpeechRecognition, TextBlob, TensorFlow, OpenCV |
| **System Dependency** | ffmpeg (for audio conversion to WAV format) |

Frontend leverages the **MediaRecorder API** for accessing **microphone** and **camera**.

---

## 🧠 **Architecture Overview**

---

## 🚀 **Deployment (Render PaaS)**

This application is optimized for deployment on **Render** or **Heroku**,  
platforms that support full **Python environments** and **system binaries** like `ffmpeg`.

### 🔧 **Configuration Files**

| File | Purpose |
|------|----------|
| `Procfile` | Defines Gunicorn startup command → `web: gunicorn app:app` |
| `requirements.txt` | Lists all Python dependencies (`Flask`, `librosa`, `DeepFace`, etc.) |
| `Aptfile` | Ensures installation of system-level dependencies like `ffmpeg` |

---

🌐 **Live Demo:** [https://auracoach.onrender.com/](https://auracoach.onrender.com/)

