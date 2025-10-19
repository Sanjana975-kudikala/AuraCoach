# utils.py
import subprocess
import os

def convert_to_wav(input_path, output_path):
    """
    Convert any audio file to WAV using ffmpeg
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"{input_path} does not exist")
    
    command = [
        "ffmpeg",
        "-y",  # overwrite
        "-i", input_path,
        "-ar", "16000",  # sample rate
        "-ac", "1",      # mono
        output_path
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return output_path
