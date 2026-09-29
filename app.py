"""
Flask Backend Server for the CRC Simulator.

This file creates a web server that:
  1. Serves the static HTML/CSS/JS files (frontend)
  2. Provides API endpoints (/api/encode, /api/verify, /api/parse-poly,
     /api/simulate-channel) that the frontend JS calls to perform
     CRC calculations using Python (crc_logic.py)
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from crc_logic import (
    encode_crc,
    verify_crc,
    parse_polynomial_input,
    simulate_channel_transmission
)

# Create the Flask app
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Allow cross-origin requests (needed for frontend-backend communication)


# ─── Serve Frontend Files ─────────────────────────────────────────────
@app.route('/')
def serve_index():
    """Serve the main landing page."""
    return send_from_directory('.', 'index.html')


@app.route('/sender.html')
def serve_sender():
    """Serve the sender page."""
    return send_from_directory('.', 'sender.html')


@app.route('/receiver.html')
def serve_receiver():
    """Serve the receiver page."""
    return send_from_directory('.', 'receiver.html')


@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files."""
    return send_from_directory('css', filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files."""
    return send_from_directory('js', filename)


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve asset files (images, videos, etc.)."""
    return send_from_directory('assets', filename)


# ─── API Endpoints (CRC Calculations in Python) ──────────────────────

@app.route('/api/encode', methods=['POST'])
def api_encode():
    """
    Encode data using CRC.

    Request JSON:
        { "data": "110101", "poly": "1011" }

    Response JSON:
        {
            "codeword": "110101001",
            "remainder": "001",
            "steps": [ ... ]
        }
    """
    body = request.get_json()

    data = body.get('data', '')
    poly = body.get('poly', '')

    # Validate inputs
    if not data or not all(c in '01' for c in data):
        return jsonify({'error': 'Invalid data. Must be a binary string (0s and 1s only).'}), 400

    if not poly or not all(c in '01' for c in poly) or len(poly) < 2:
        return jsonify({'error': 'Invalid polynomial. Must be a binary string with at least 2 bits.'}), 400

    result = encode_crc(data, poly)
    return jsonify(result)


@app.route('/api/verify', methods=['POST'])
def api_verify():
    """
    Verify a received codeword using CRC.

    Request JSON:
        { "codeword": "110101001", "poly": "1011" }

    Response JSON:
        {
            "isValid": true,
            "remainder": "000",
            "steps": [ ... ]
        }
    """
    body = request.get_json()

    codeword = body.get('codeword', '')
    poly = body.get('poly', '')

    # Validate inputs
    if not codeword or not all(c in '01' for c in codeword):
        return jsonify({'error': 'Invalid codeword. Must be a binary string.'}), 400

    if not poly or not all(c in '01' for c in poly) or len(poly) < 2:
        return jsonify({'error': 'Invalid polynomial. Must be a binary string with at least 2 bits.'}), 400

    result = verify_crc(codeword, poly)
    return jsonify(result)


@app.route('/api/parse-poly', methods=['POST'])
def api_parse_poly():
    """
    Parse a polynomial expression into binary.

    Request JSON:
        { "input": "x^3+x+1" }

    Response JSON:
        { "binary": "1011" }
        or
        { "binary": null }  (if invalid)
    """
    body = request.get_json()
    input_str = body.get('input', '')

    result = parse_polynomial_input(input_str)
    return jsonify({'binary': result})


@app.route('/api/simulate-channel', methods=['POST'])
def api_simulate_channel():
    """
    Simulate network channel transmission (30% chance of bit flip).

    Request JSON:
        { "codeword": "110101001" }

    Response JSON:
        { "codeword": "110111001" }  (possibly with a flipped bit)
    """
    body = request.get_json()
    codeword = body.get('codeword', '')

    if not codeword or not all(c in '01' for c in codeword):
        return jsonify({'error': 'Invalid codeword.'}), 400

    result = simulate_channel_transmission(codeword)
    return jsonify({'codeword': result})


# ─── Start the Server ─────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("  CRC Simulator - Flask Backend Server")
    print("=" * 50)
    print(f"  Open in browser: http://localhost:{port}")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=port)
