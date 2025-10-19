from flask import Flask, render_template, request, jsonify
import os
from utils import convert_to_wav
from ai.audio_analysis import analyze_audio
from ai.video_analysis import analyze_video

app = Flask(__name__, template_folder="templates", static_folder="static")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/mode")
def mode():
    return render_template("mode.html")

@app.route("/voice")
def voice():
    return render_template("voice.html")

@app.route("/video")
def video():
    return render_template("video.html")

@app.route("/analyze/audio", methods=["POST"])
def analyze_audio_file():
    file = request.files["file"]
    
    # FIX: Use a temporary path for the original upload to prevent read/write conflict with ffmpeg.
    # The uploaded file is temporarily saved as 'temp_input.audio'.
    original_path = os.path.join(UPLOAD_FOLDER, "temp_input.audio")
    file.save(original_path)

    # Convert uploaded audio to WAV for compatibility. The final output file is 'voice.wav'.
    wav_path = os.path.join(UPLOAD_FOLDER, "voice.wav")
    
    # Clean up the previous final WAV file if it exists, for a clean conversion.
    if os.path.exists(wav_path):
        os.remove(wav_path)

    # Use the temporary file as input and the final path as output
    convert_to_wav(original_path, wav_path)

    # Clean up the temporary original file after conversion is complete.
    os.remove(original_path)
    
    result = analyze_audio(wav_path)
    return jsonify(result)

@app.route("/analyze/video", methods=["POST"])
def analyze_video_file():
    file = request.files["file"]
    path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(path)
    result = analyze_video(path)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)