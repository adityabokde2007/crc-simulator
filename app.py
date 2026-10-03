import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from crc_logic import (
    full_encapsulate,
    full_deencapsulate,
    simulate_channel,
    encode_crc,
    verify_crc,
    parse_polynomial_input
)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)


# ─── Serve Frontend Files ─────────────────────────────────────────────
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/sender.html')
def serve_sender():
    return send_from_directory('.', 'sender.html')


@app.route('/receiver.html')
def serve_receiver():
    return send_from_directory('.', 'receiver.html')


# ─── New Endpoints for Final Workflow ─────────────────────────────────

@app.route('/api/encapsulate', methods=['POST'])
def api_encapsulate():
    """
    Takes a text message, converts it to binary payload, generates MACs,
    builds the frame, and calculates the CRC remainder.
    """
    body = request.get_json()
    message = body.get('message', '')

    if not message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    if len(message.split()) > 50:
        return jsonify({'error': 'Message too long (max 50 words).'}), 400

    try:
        result = full_encapsulate(message)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/verify', methods=['POST'])
def api_verify():
    """
    Takes a received codeword, verifies CRC, extracts payload,
    and decodes back to text.
    """
    body = request.get_json()
    codeword = body.get('codeword', '')

    if not codeword:
        return jsonify({'error': 'Invalid codeword.'}), 400

    try:
        result = full_deencapsulate(codeword)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/noise', methods=['POST'])
def api_noise():
    """
    Simulates transmission through a noisy channel (silent bit flip).
    """
    body = request.get_json()
    codeword = body.get('codeword', '')
    probability = float(body.get('probability', 0.3))

    if not codeword:
        return jsonify({'error': 'Invalid codeword.'}), 400

    result = simulate_channel(codeword, probability)
    return jsonify(result)


# ─── Start the Server ─────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("  CRC Simulator - Flask Backend Server")
    print("=" * 50)
    print(f"  Open in browser: http://localhost:{port}")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=port)
