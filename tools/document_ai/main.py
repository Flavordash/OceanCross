#!/usr/bin/env python3
"""CLI entry point for aviation document extraction.

Usage:
    python main.py --type aircraft --input ./sample.pdf
    python main.py --type credential --input ./medical.png
    python main.py --type parts --input ./invoice.pdf
    python main.py --type aircraft --input ./sample.pdf --output ./output/result.json
"""

import argparse
import sys
from pathlib import Path

# Add project root to path so imports work
sys.path.insert(0, str(Path(__file__).parent))

from extractors import aircraft_extractor, credential_extractor, parts_extractor


EXTRACTORS = {
    "aircraft": aircraft_extractor.extract,
    "credential": credential_extractor.extract,
    "parts": parts_extractor.extract,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract structured data from aviation documents (PDF/PNG)."
    )
    parser.add_argument(
        "--type",
        required=True,
        choices=list(EXTRACTORS.keys()),
        help="Document type to extract",
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to PDF or image file",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Path to save JSON output (default: stdout)",
    )

    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    extractor = EXTRACTORS[args.type]

    try:
        result = extractor(input_path)
    except Exception as e:
        print(f"Error: Extraction failed: {e}", file=sys.stderr)
        sys.exit(1)

    json_output = result.model_dump_json(indent=2, exclude_none=True)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_output)
        print(f"Saved to {output_path}")
    else:
        print(json_output)


if __name__ == "__main__":
    main()
