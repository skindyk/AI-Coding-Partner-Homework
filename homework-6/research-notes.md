# Research Notes — Banking Pipeline

## Query 1: Python decimal module
- Search: "Python decimal module"
- context7 library ID: /python/decimal
- Applied: Used `Decimal(str(value))` throughout all agents to prevent floating-point precision errors in monetary calculations. Used `ROUND_HALF_UP` context for compliance boundary checks (e.g., $10,000 threshold).

## Query 2: Python pathlib
- Search: "Python pathlib standard library"
- context7 library ID: /python/pathlib
- Applied: Used `Path(__file__).parent` for portable directory resolution, `Path.glob("*.json")` for reading shared/ directories, and `Path.write_text()` / `Path.read_text()` for file-based message passing between agents.
