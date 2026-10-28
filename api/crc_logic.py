"""
CRC Logic - Core Calculation Functions (Python)
This file contains ALL the CRC math/calculation logic.
Translated from js/crc.js and js/network.js into Python.
"""

import random
import re

# We use CRC-16-CCITT: x^16 + x^12 + x^5 + 1 -> 10001000000100001
CRC16_POLY = "10001000000100001"

def text_to_binary(text: str) -> dict:
    """
    Converts a text string to ASCII details and a concatenated binary string.
    """
    chars = []
    binary_str = ""
    for char in text:
        dec = ord(char)
        hx = format(dec, '02x')
        bin_val = format(dec, '08b')
        binary_str += bin_val
        chars.append({
            'char': char,
            'decimal': dec,
            'hex': hx,
            'binary': bin_val
        })
    return {
        'chars': chars,
        'binaryString': binary_str,
        'message': text
    }

def binary_to_text(binary_str: str) -> str:
    """
    Converts a binary string back to text. 8 bits per character.
    If corrupted, returns garbled text (like real corruption).
    """
    chars = []
    # Process in 8-bit chunks
    for i in range(0, len(binary_str) - 7, 8):
        chunk = binary_str[i:i+8]
        try:
            char_code = int(chunk, 2)
            # Only allow printable ascii range to avoid breaking UI
            if 32 <= char_code <= 126:
                chars.append(chr(char_code))
            else:
                # Use unicode replacement character for garbled text
                chars.append('')
        except ValueError:
            chars.append('')
    return "".join(chars)

def generate_random_mac() -> str:
    """Generate a random fake MAC address."""
    return ":".join(f"{random.randint(0, 255):02X}" for _ in range(6))

def mac_to_binary(mac: str) -> str:
    """Convert MAC address string (AA:BB:CC:DD:EE:FF) to 48-bit binary string."""
    clean_mac = mac.replace(":", "").replace("-", "")
    return bin(int(clean_mac, 16))[2:].zfill(48)

def binary_to_mac(binary: str) -> str:
    """Convert 48-bit binary string to MAC address string."""
    hex_str = format(int(binary, 2), '012x').upper()
    return ":".join(hex_str[i:i+2] for i in range(0, 12, 2))

def xor_division(dividend: str, divisor: str) -> dict:
    """
    Performs Modulo-2 binary division using XOR operations.
    """
    steps = []
    current = dividend[:len(divisor)]
    pos = len(divisor)

    while pos <= len(dividend):
        if current[0] == '1':
            xor_result = ''
            for i in range(len(divisor)):
                xor_result += '0' if current[i] == divisor[i] else '1'

            steps.append({
                'dividend': current,
                'divisor': divisor,
                'xorResult': xor_result,
                'padding': ' ' * (pos - len(divisor))
            })
            current = xor_result[1:]
        else:
            zero_divisor = '0' * len(divisor)
            xor_result = ''
            for i in range(len(divisor)):
                xor_result += '0' if current[i] == zero_divisor[i] else '1'

            steps.append({
                'dividend': current,
                'divisor': zero_divisor,
                'xorResult': xor_result,
                'padding': ' ' * (pos - len(divisor))
            })
            current = xor_result[1:]

        if pos < len(dividend):
            current += dividend[pos]
        pos += 1

    return {'steps': steps, 'remainder': current}


def full_encapsulate(message: str) -> dict:
    """
    SENDER FLOW:
    1. Text -> Binary (Payload)
    2. Auto-gen MACs -> Header
    3. Frame = Header + Payload
    4. CRC = Frame % CRC16_POLY
    5. Final = Frame + CRC
    """
    # 1. Text to Binary
    app_layer = text_to_binary(message)
    payload_bits = app_layer['binaryString']

    # 2. Build Header
    src_mac = generate_random_mac()
    dst_mac = generate_random_mac()
    header_bits = mac_to_binary(src_mac) + mac_to_binary(dst_mac)
    
    # 3. Frame without CRC
    frame_bits = header_bits + payload_bits

    # 4. CRC Calculation
    degree = len(CRC16_POLY) - 1
    dividend = frame_bits + '0' * degree
    crc_result = xor_division(dividend, CRC16_POLY)
    crc_remainder = crc_result['remainder']

    # 5. Final Codeword
    codeword = frame_bits + crc_remainder

    return {
        'message': message,
        'generator': CRC16_POLY,
        'srcMAC': src_mac,
        'dstMAC': dst_mac,
        'payloadBits': payload_bits,
        'headerBits': header_bits,
        'frameBits': frame_bits,
        'crcRemainder': crc_remainder,
        'crcSteps': crc_result['steps'],
        'finalCodeword': codeword,
        'asciiTable': app_layer['chars']
    }


def full_deencapsulate(codeword: str) -> dict:
    """
    RECEIVER FLOW:
    1. Verify CRC on entire codeword
    2. Extract MACs
    3. Extract Payload
    4. Payload -> Text
    """
    degree = len(CRC16_POLY) - 1
    
    # 1. Verify CRC
    crc_result = xor_division(codeword, CRC16_POLY)
    is_valid = int(crc_result['remainder'], 2) == 0

    # 2. Extract Parts
    frame_bits = codeword[:-degree]
    received_crc = codeword[-degree:]
    
    header_bits = frame_bits[:96]
    src_mac_bits = header_bits[:48]
    dst_mac_bits = header_bits[48:96]
    
    payload_bits = frame_bits[96:]
    
    # 3. Decode Text
    decoded_text = binary_to_text(payload_bits)

    return {
        'isValid': is_valid,
        'calculatedRemainder': crc_result['remainder'],
        'receivedCRC': received_crc,
        'crcSteps': crc_result['steps'],
        'srcMAC': binary_to_mac(src_mac_bits),
        'dstMAC': binary_to_mac(dst_mac_bits),
        'decodedText': decoded_text,
        'payloadBits': payload_bits,
        'headerBits': header_bits
    }


def flip_random_bit(codeword: str) -> dict:
    # Ensure we only flip a bit in the payload so the text actually changes visually.
    # Header is 96 bits, CRC trailer is 16 bits.
    min_idx = 96
    max_idx = len(codeword) - 17
    
    if min_idx > max_idx:
        index = random.randint(0, len(codeword) - 1)
    else:
        index = random.randint(min_idx, max_idx)
        
    chars = list(codeword)
    chars[index] = '1' if chars[index] == '0' else '0'
    return {
        'newCodeword': ''.join(chars),
        'flippedIndex': index,
        'wasCorrupted': True
    }


def simulate_channel(codeword: str, probability: float = 0.3) -> dict:
    if random.random() < probability:
        return flip_random_bit(codeword)
    return {
        'newCodeword': codeword,
        'flippedIndex': -1,
        'wasCorrupted': False
    }

# Keep legacy methods for any old endpoints to not break anything
def encode_crc(data: str, poly: str) -> dict:
    dividend = data + '0' * (len(poly) - 1)
    result = xor_division(dividend, poly)
    return {'codeword': data + result['remainder'], 'steps': result['steps'], 'remainder': result['remainder']}

def verify_crc(codeword: str, poly: str) -> dict:
    result = xor_division(codeword, poly)
    return {'isValid': int(result['remainder'], 2) == 0, 'steps': result['steps'], 'remainder': result['remainder']}

def parse_polynomial_input(input_str: str) -> str | None:
    return CRC16_POLY
