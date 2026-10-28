from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from .crc_logic import (
        full_encapsulate,
        full_deencapsulate,
        simulate_channel
    )
except ImportError:
    from crc_logic import (
        full_encapsulate,
        full_deencapsulate,
        simulate_channel
    )

app = Flask(__name__)
CORS(app)


@app.route('/api/encapsulate', methods=['POST'])
@app.route('/encapsulate', methods=['POST'])
def api_encapsulate():
    body = request.get_json() or {}
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
@app.route('/verify', methods=['POST'])
def api_verify():
    body = request.get_json() or {}
    codeword = body.get('codeword', '')

    if not codeword:
        return jsonify({'error': 'Invalid codeword.'}), 400

    try:
        result = full_deencapsulate(codeword)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/noise', methods=['POST'])
@app.route('/noise', methods=['POST'])
def api_noise():
    body = request.get_json() or {}
    codeword = body.get('codeword', '')
    probability = float(body.get('probability', 0.3))

    if not codeword:
        return jsonify({'error': 'Invalid codeword.'}), 400

    result = simulate_channel(codeword, probability)
    return jsonify(result)
