"""Check the exported Draft 2020-12 contracts with python-jsonschema."""

import json
import sys

from jsonschema import Draft202012Validator, FormatChecker

data = json.load(sys.stdin)
validators = {}
for name, schema in data["schemas"].items():
    Draft202012Validator.check_schema(schema)
    validators[name] = Draft202012Validator(schema, format_checker=FormatChecker())

for index, case in enumerate(data["cases"]):
    actual = validators[case["name"]].is_valid(case["value"])
    if actual != case["expected"]:
        raise ValueError(f"Schema parity failed for case {index}, {case['name']}")

if not validators["evidence"].is_valid(data["runtimeOnly"]):
    raise ValueError("Expected the JSON Schema to leave span ordering to runtime")
print(f"Verified six schemas against {len(data['cases'])} fixtures. Span ordering remains runtime-only.")
