"""
CRC Logic - Core Calculation Functions (Python)
This file contains ALL the CRC math/calculation logic.
Translated from js/crc.js and js/network.js into Python.
"""

import random
import re


def xor_division(dividend: str, divisor: str) -> dict:
    """
    Performs Modulo-2 binary division using XOR operations.
    This is the CORE algorithm behind CRC error detection.

    Args:
        dividend: The binary string to be divided (e.g., "110101000")
        divisor:  The generator polynomial in binary (e.g., "1011")

    Returns:
        A dict with 'steps' (list of intermediate XOR steps) and 'remainder' (final remainder string)
    """
    steps = []

    # Take the first chunk of bits equal to the length of the divisor
    current = dividend[:len(divisor)]
    pos = len(divisor)

    while pos <= len(dividend):
        if current[0] == '1':
            # If the leading bit is 1, XOR with the actual divisor
            xor_result = ''
            for i in range(len(divisor)):
                xor_result += '0' if current[i] == divisor[i] else '1'

            steps.append({
                'dividend': current,
                'divisor': divisor,
                'xorResult': xor_result,
                'padding': ' ' * (pos - len(divisor))
            })

            # Drop the leading bit (it's always 0 after XOR) and continue
            current = xor_result[1:]
        else:
            # If the leading bit is 0, XOR with all zeros (result is same as current)
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

            # Drop the leading bit and continue
            current = xor_result[1:]

        # Bring down the next bit from the dividend
        if pos < len(dividend):
            current += dividend[pos]

        pos += 1

    return {'steps': steps, 'remainder': current}


def encode_crc(data: str, poly: str) -> dict:
    """
    Encodes data using CRC by appending remainder bits.
    This is what the SENDER uses before transmitting data.

    Steps:
      1. Append (len(poly) - 1) zeros to the original data
      2. Divide the padded data by the polynomial using xor_division
      3. The remainder becomes the CRC check bits
      4. Codeword = original data + remainder

    Args:
        data: The original binary data string (e.g., "110101")
        poly: The generator polynomial in binary (e.g., "1011")

    Returns:
        A dict with 'codeword', 'steps', and 'remainder'
    """
    # Step 1: Pad the data with zeros
    dividend = data + '0' * (len(poly) - 1)

    # Step 2: Perform XOR division
    result = xor_division(dividend, poly)

    # Step 3: Create codeword = original data + CRC remainder
    codeword = data + result['remainder']

    return {
        'codeword': codeword,
        'steps': result['steps'],
        'remainder': result['remainder']
    }


def verify_crc(codeword: str, poly: str) -> dict:
    """
    Verifies a received codeword using CRC.
    This is what the RECEIVER uses to check for errors.

    Steps:
      1. Divide the entire received codeword by the polynomial
      2. If the remainder is all zeros → data is valid (no errors)
      3. If the remainder is non-zero → errors detected

    Args:
        codeword: The received binary codeword string
        poly:     The same generator polynomial used by the sender

    Returns:
        A dict with 'isValid' (bool), 'steps', and 'remainder'
    """
    result = xor_division(codeword, poly)
    is_valid = int(result['remainder'], 2) == 0

    return {
        'isValid': is_valid,
        'steps': result['steps'],
        'remainder': result['remainder']
    }


def flip_random_bit(codeword: str) -> dict:
    """
    Flips a single random bit in the codeword to simulate transmission errors.

    Args:
        codeword: The binary codeword string

    Returns:
        A dict with 'newCodeword' and 'flippedIndex'
    """
    index = random.randint(0, len(codeword) - 1)
    chars = list(codeword)
    chars[index] = '1' if chars[index] == '0' else '0'

    return {
        'newCodeword': ''.join(chars),
        'flippedIndex': index
    }


def simulate_channel_transmission(codeword: str) -> str:
    """
    Simulates a noisy network channel.
    30% chance of flipping one random bit (simulating interference/noise).
    70% chance of clean transmission.

    Args:
        codeword: The binary codeword string to transmit

    Returns:
        The (possibly corrupted) codeword string
    """
    if random.random() < 0.3:
        result = flip_random_bit(codeword)
        return result['newCodeword']
    return codeword


def parse_polynomial_input(input_str: str) -> str | None:
    """
    Converts polynomial expressions (like "x^3+x+1") or
    binary strings (like "1011") into a binary string.

    Supported formats:
      - Binary: "1011"
      - Algebraic: "x^3+x+1", "x⁴+x+1", "x4+x+1"

    Args:
        input_str: The user's input string

    Returns:
        A binary string (e.g., "1011") or None if the input is invalid
    """
    trimmed = input_str.strip()
    if not trimmed:
        return None

    # Case 1: Already a binary string (only 0s and 1s)
    if re.match(r'^[01]+$', trimmed):
        return trimmed

    # Case 2: Algebraic polynomial expression (contains 'x')
    if 'x' in trimmed.lower():
        clean_str = trimmed.lower().replace(' ', '')

        # Normalize Unicode superscripts to regular digits
        superscript_map = {
            '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
            '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
        }
        for sup, digit in superscript_map.items():
            clean_str = clean_str.replace(sup, digit)

        # Validate: only allow x, ^, +, and digits
        if re.search(r'[^x\^+0-9]', clean_str):
            return None

        terms = [t for t in clean_str.split('+') if len(t) > 0]
        powers = []

        for term in terms:
            if term == 'x':
                powers.append(1)
            elif term.startswith('x^'):
                power_str = term[2:]
                try:
                    power = int(power_str)
                    if power < 0:
                        return None
                    powers.append(power)
                except ValueError:
                    return None
            elif term.startswith('x') and len(term) > 1:
                # Handles x4 after superscript normalization
                power_str = term[1:]
                try:
                    power = int(power_str)
                    if power < 0:
                        return None
                    powers.append(power)
                except ValueError:
                    return None
            elif re.match(r'^\d+$', term):
                powers.append(0)
            else:
                return None

        if not powers:
            return None

        max_power = max(powers)
        binary_arr = ['0'] * (max_power + 1)

        for p in powers:
            binary_arr[max_power - p] = '1'

        return ''.join(binary_arr)

    return None
